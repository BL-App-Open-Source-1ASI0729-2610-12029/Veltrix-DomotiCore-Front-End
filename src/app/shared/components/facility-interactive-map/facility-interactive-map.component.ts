import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  Output,
  ViewChild,
  signal,
} from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { GOOGLE_ICONS } from '../../constants/google-icons';
import { MATERIAL_IMPORTS } from '../../material';

export interface FacilityMapMarker {
  id: string;
  x: number;
  y: number;
  variant?: 'online' | 'standby' | 'offline' | 'alert' | 'normal';
  label?: string;
}

@Component({
  selector: 'app-facility-interactive-map',
  standalone: true,
  imports: [CommonModule, TranslateModule, ...MATERIAL_IMPORTS],
  templateUrl: './facility-interactive-map.component.html',
  styleUrls: ['./facility-interactive-map.component.css'],
})
export class FacilityInteractiveMapComponent implements AfterViewInit, OnDestroy {
  @ViewChild('mapViewport') mapViewportRef?: ElementRef<HTMLElement>;
  @ViewChild('mapStage') mapStageRef?: ElementRef<HTMLElement>;

  @Input() imageSrc = 'assets/icons/small-business/mapp.png';
  @Input() markers: FacilityMapMarker[] = [];
  @Input() showControls = true;
  @Input() showHint = true;
  @Input() hintKey = 'shared.facilityMap.panHint';

  @Output() markerClick = new EventEmitter<string>();

  readonly icons = GOOGLE_ICONS;
  readonly mapZoom = signal(1);
  readonly mapPanX = signal(0);
  readonly mapPanY = signal(0);
  readonly isMapPanning = signal(false);

  private panPointerId: number | null = null;
  private panStart = { x: 0, y: 0, panX: 0, panY: 0 };
  private readonly panDragThreshold = 4;
  private resizeObserver?: ResizeObserver;
  private minZoom = 1;

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

  mapTransform(): string {
    const x = this.mapPanX();
    const y = this.mapPanY();
    const z = this.mapZoom();
    return `translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) scale(${z})`;
  }

  markerClass(variant: FacilityMapMarker['variant']): string {
    const value = variant ?? 'normal';
    return `facility-map-marker facility-map-marker--${value}`;
  }

  onMapPanStart(event: PointerEvent): void {
    if (event.button !== 0) return;
    if ((event.target as HTMLElement).closest('.facility-map-marker-btn')) return;

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

  onMapZoomIn(): void {
    this.setZoom(this.mapZoom() + 0.15);
  }

  onMapZoomOut(): void {
    this.setZoom(this.mapZoom() - 0.15);
  }

  onMarkerClick(markerId: string, event: Event): void {
    event.stopPropagation();
    this.markerClick.emit(markerId);
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
