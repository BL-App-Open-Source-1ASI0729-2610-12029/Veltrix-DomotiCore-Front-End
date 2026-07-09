import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { BusinessDevicesStore } from '../../../application/business-devices.store';
import { DeviceExplorerStore } from '../../../application/device-explorer.store';
import {
  ExplorerDeviceCategory,
  ExplorerDeviceStatus,
} from '../../../infrastructure/device-explorer-response';
import { BusinessDevicesNavComponent } from '../../components/business-devices-nav/business-devices-nav.component';
import { GOOGLE_ICONS, GoogleIconKey } from '../../../../app/shared/constants/google-icons';
import { UiFeedbackService } from '../../../../app/shared/services/ui-feedback.service';
import { downloadJsonFile } from '../../../../app/shared/utils/download-file.util';
import { MATERIAL_IMPORTS } from '../../../../app/shared/material';

type MapLayer = 'floor' | 'zones';

@Component({
  selector: 'app-device-explorer',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, BusinessDevicesNavComponent, ...MATERIAL_IMPORTS],
  templateUrl: './device-explorer.component.html',
  styleUrls: ['./device-explorer.component.css'],
})
export class DeviceExplorerComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('mapViewport') mapViewportRef?: ElementRef<HTMLElement>;
  @ViewChild('mapStage') mapStageRef?: ElementRef<HTMLElement>;

  readonly store = inject(DeviceExplorerStore);
  private readonly businessDevicesStore = inject(BusinessDevicesStore);
  readonly icons = GOOGLE_ICONS;
  readonly router = inject(Router);
  readonly floorPlanSrc = 'assets/icons/small-business/mapp.png';

  readonly mapZoom = signal(1);
  readonly mapPanX = signal(0);
  readonly mapPanY = signal(0);
  readonly mapLayer = signal<MapLayer>('floor');
  readonly isMapPanning = signal(false);
  readonly selectedMapDeviceId = signal<string | null>(null);
  readonly showAddDeviceModal = signal(false);

  newDeviceName = '';
  newDeviceZone = 'main-office';
  newDeviceCategory: ExplorerDeviceCategory = 'sensors';
  newDeviceProtocol = 'MQTT';

  private panPointerId: number | null = null;
  private panStart = { x: 0, y: 0, panX: 0, panY: 0 };
  private readonly panDragThreshold = 4;
  private resizeObserver?: ResizeObserver;
  private minZoom = 1;
  readonly categories: ExplorerDeviceCategory[] = [
    'hvac',
    'lighting',
    'security',
    'sensors',
    'powerPlugs',
  ];

  private readonly feedback = inject(UiFeedbackService);
  private readonly translate = inject(TranslateService);
  private readonly route = inject(ActivatedRoute);

  ngOnInit(): void {
    this.store.load();

    this.route.queryParamMap.subscribe(params => {
      const zone = params.get('zone');
      if (zone) {
        this.store.setFacilityZone(zone);
      }

      const query = params.get('q');
      if (query) {
        this.store.setNameQuery(query);
      }

      if (params.get('scan') === '1') {
        this.triggerNetworkScan();
      }

      if (params.get('add') === '1') {
        this.openAddDeviceModal();
        this.clearAddQueryParam();
      }
    });
  }

  ngAfterViewInit(): void {
    window.setTimeout(() => this.updateMapMetrics());

    const viewport = this.mapViewportRef?.nativeElement;
    if (viewport && typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => this.updateMapMetrics());
      this.resizeObserver.observe(viewport);
    }
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
  }

  deviceIcon(iconKey: string): string {
    return GOOGLE_ICONS[iconKey as GoogleIconKey] ?? GOOGLE_ICONS.deviceHub;
  }

  categoryKey(category: ExplorerDeviceCategory): string {
    return `deviceExplorer.categories.${category}`;
  }

  zoneOptionKey(zone: string): string {
    if (zone === 'all') return 'deviceExplorer.filters.allZones';
    return `deviceExplorer.facilityZones.${zone}`;
  }

  statusClass(status: ExplorerDeviceStatus): string {
    return `status-badge status-badge--${status}`;
  }

  statusKey(status: ExplorerDeviceStatus): string {
    return `deviceExplorer.status.${status}`;
  }

  paginationParts(): { start: number; end: number; total: number } {
    const parts = this.store.paginationLabel().split(':');
    const range = parts[0]?.split('-').map(Number) ?? [0, 0];
    return {
      start: range[0] ?? 0,
      end: range[1] ?? 0,
      total: Number(parts[1] ?? 0),
    };
  }

  onExportResult(): void {
    const stamp = new Date().toISOString().slice(0, 10);
    downloadJsonFile(`device-explorer-${stamp}.json`, {
      exportedAt: new Date().toISOString(),
      filters: {
        zone: this.store.facilityZone(),
        categories: this.store.selectedCategories(),
        protocol: this.store.protocol(),
        onlineOnly: this.store.onlineOnly(),
      },
      devices: this.store.filteredDevices(),
    });
    this.feedback.showToast(this.translate.instant('deviceExplorer.toast.exportReady'), 'success');
  }

  onNetworkScan(): void {
    this.triggerNetworkScan();
  }

  openAddDeviceModal(): void {
    const data = this.store.data();
    this.newDeviceName = '';
    this.newDeviceZone = data?.facilityZones.find(zone => zone !== 'all') ?? 'main-office';
    this.newDeviceCategory = 'sensors';
    this.newDeviceProtocol = data?.protocols[0] ?? 'MQTT';
    this.showAddDeviceModal.set(true);
  }

  closeAddDeviceModal(): void {
    this.showAddDeviceModal.set(false);
  }

  submitAddDevice(): void {
    if (!this.newDeviceName.trim()) {
      this.feedback.showToast(this.translate.instant('deviceExplorer.addModal.nameRequired'), 'warning');
      return;
    }

    const device = this.store.addDevice({
      name: this.newDeviceName,
      facilityZone: this.newDeviceZone,
      category: this.newDeviceCategory,
      protocol: this.newDeviceProtocol,
    });

    if (!device) return;

    const registerInManagement = () => {
      this.businessDevicesStore.addDevice({
        id: device.id,
        name: device.name,
        icon: device.icon,
        facilityZone: device.facilityZone,
      });
    };

    if (this.businessDevicesStore.overview()) {
      registerInManagement();
    } else {
      this.businessDevicesStore.load().subscribe(() => registerInManagement());
    }

    this.selectedMapDeviceId.set(device.id);
    this.closeAddDeviceModal();
    this.feedback.showToast(
      this.translate.instant('deviceExplorer.toast.deviceAdded', { name: device.name }),
      'success',
    );
  }

  onOpenDevice(deviceId: string, facilityZone: string): void {
    this.router.navigate(['/app/devices', facilityZone, deviceId]);
  }

  onDeviceRowClick(deviceId: string, facilityZone: string): void {
    this.onOpenDevice(deviceId, facilityZone);
  }

  onQuickAssist(): void {
    this.feedback.openHelp('devices');
  }

  mapDevices() {
    return this.store.filteredDevices();
  }

  mapTransform(): string {
    const x = this.mapPanX();
    const y = this.mapPanY();
    const z = this.mapZoom();
    return `translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) scale(${z})`;
  }

  onMapPanStart(event: PointerEvent): void {
    if (event.button !== 0) return;
    if ((event.target as HTMLElement).closest('.floor-plan__dot-btn')) return;

    this.panPointerId = event.pointerId;
    this.panStart = {
      x: event.clientX,
      y: event.clientY,
      panX: this.mapPanX(),
      panY: this.mapPanY(),
    };
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
  }

  onMapPanMove(event: PointerEvent): void {
    if (this.panPointerId !== event.pointerId) return;

    const dx = event.clientX - this.panStart.x;
    const dy = event.clientY - this.panStart.y;

    if (!this.isMapPanning() && Math.hypot(dx, dy) < this.panDragThreshold) return;

    this.isMapPanning.set(true);
    this.setPan(this.panStart.panX + dx, this.panStart.panY + dy);
  }

  onMapPanEnd(event: PointerEvent): void {
    if (this.panPointerId !== event.pointerId) return;

    this.panPointerId = null;
    this.isMapPanning.set(false);

    if ((event.currentTarget as HTMLElement).hasPointerCapture(event.pointerId)) {
      (event.currentTarget as HTMLElement).releasePointerCapture(event.pointerId);
    }
  }

  onMapReset(): void {
    this.mapPanX.set(0);
    this.mapPanY.set(0);
    this.setZoom(this.minZoom);
  }

  isZoneHighlighted(zone: string): boolean {
    const selected = this.store.facilityZone();
    return selected !== 'all' && selected === zone;
  }

  onMapZoomIn(): void {
    this.setZoom(this.mapZoom() + 0.15);
  }

  onMapZoomOut(): void {
    this.setZoom(this.mapZoom() - 0.15);
  }

  onToggleMapLayer(): void {
    this.mapLayer.update(layer => (layer === 'floor' ? 'zones' : 'floor'));
    this.feedback.showToast(
      this.translate.instant(
        this.mapLayer() === 'zones'
          ? 'deviceExplorer.map.layerZones'
          : 'deviceExplorer.map.layerFloor',
      ),
      'info',
    );
  }

  onMapDeviceClick(deviceId: string, facilityZone: string, event: Event): void {
    event.stopPropagation();
    this.selectedMapDeviceId.set(deviceId);
    this.onOpenDevice(deviceId, facilityZone);
  }

  mapDotClass(status: ExplorerDeviceStatus): string {
    return `floor-plan__dot floor-plan__dot--${status}`;
  }

  private clearAddQueryParam(): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { add: null },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  private triggerNetworkScan(): void {
    if (this.store.scanning()) return;

    this.feedback.showToast(this.translate.instant('deviceExplorer.toast.networkScanStarted'), 'info');
    this.store.runNetworkScan();

    window.setTimeout(() => {
      if (!this.store.scanning()) {
        this.feedback.showToast(this.translate.instant('deviceExplorer.toast.scanComplete'), 'success');
        this.router.navigate([], {
          relativeTo: this.route,
          queryParams: { scan: null },
          queryParamsHandling: 'merge',
          replaceUrl: true,
        });
      }
    }, 1900);
  }

  private updateMapMetrics(): void {
    const viewport = this.mapViewportRef?.nativeElement;
    const stage = this.mapStageRef?.nativeElement;
    if (!viewport || !stage) return;

    const vw = viewport.clientWidth;
    const vh = viewport.clientHeight;
    const sw = stage.offsetWidth;
    const sh = stage.offsetHeight;
    if (!vw || !vh || !sw || !sh) return;

    this.minZoom = Math.max(vw / sw, vh / sh, 1);
    this.setZoom(this.mapZoom());
  }

  private clampPan(panX: number, panY: number, zoom: number): { x: number; y: number } {
    const viewport = this.mapViewportRef?.nativeElement;
    const stage = this.mapStageRef?.nativeElement;
    if (!viewport || !stage) return { x: panX, y: panY };

    const vw = viewport.clientWidth;
    const vh = viewport.clientHeight;
    const scaledW = stage.offsetWidth * zoom;
    const scaledH = stage.offsetHeight * zoom;

    let x = panX;
    let y = panY;

    if (scaledW >= vw) {
      const maxX = (scaledW - vw) / 2;
      x = Math.min(maxX, Math.max(-maxX, x));
    } else {
      x = 0;
    }

    if (scaledH >= vh) {
      const maxY = (scaledH - vh) / 2;
      y = Math.min(maxY, Math.max(-maxY, y));
    } else {
      y = 0;
    }

    return { x, y };
  }

  private setPan(panX: number, panY: number): void {
    const { x, y } = this.clampPan(panX, panY, this.mapZoom());
    this.mapPanX.set(x);
    this.mapPanY.set(y);
  }

  private applyPanBounds(): void {
    this.setPan(this.mapPanX(), this.mapPanY());
  }

  private setZoom(zoom: number): void {
    const next = Math.max(this.minZoom, Math.min(1.6, zoom));
    this.mapZoom.set(Number(next.toFixed(2)));
    this.applyPanBounds();
  }
}
