/// <reference types="google.maps" />
import { Component, ElementRef, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { NgbModal, NgbOffcanvas } from '@ng-bootstrap/ng-bootstrap';
import Swal from 'sweetalert2';
import { environment } from '../../../environments/environment';
import { Vehicle, VehicleService } from '../vehicles/vehicle.service';

import {
  CollectionArea,
  CollectionAreaPayload,
  CollectionRoute,
  CollectionRoutePayload,
  CollectionService
} from './collection.service';

@Component({
  selector: 'app-collection-setup',
  templateUrl: './collection-setup.component.html',
  styleUrls: ['./collection-setup.component.scss'],
  standalone: false
})
export class CollectionSetupComponent implements OnInit {
  @ViewChild('areaLocationAutocomplete') private areaLocationAutocomplete?: ElementRef<HTMLDivElement>;
  breadCrumbItems: Array<{}> = [{ label: 'Waste Collection' }, { label: 'Areas & Routes', active: true }];
  activeTab: 'areas' | 'routes' = 'areas';
  areas: CollectionArea[] = [];
  routes: CollectionRoute[] = [];
  vehicles: Vehicle[] = [];
  areaForm = this.emptyAreaForm();
  routeForm = this.emptyRouteForm();
  editingArea: CollectionArea | null = null;
  editingRoute: CollectionRoute | null = null;
  isLoading = false;
  isSaving = false;
  organisations: any[] = [];
  showOrganisationForm = false;
  readonly addOrganisationOption = '__add_contracting_organisation__';
  organisationForm: any = { name: '', commission_type: 'PERCENTAGE_OF_LUMP_SUM', commission_rate: null, contract_start_date: null, contract_end_date: null };
  readonly googleMapsApiKeyConfigured = Boolean(environment.googleMapsApiKey.trim());

  constructor(private readonly collectionService: CollectionService, private readonly vehicleService: VehicleService, private readonly modalService: NgbModal, private readonly offcanvasService: NgbOffcanvas) {}

  ngOnInit(): void { this.loadData(); this.loadVehicles(); this.collectionService.listContractingOrganisations().subscribe({ next: r => this.organisations = r.data }); }

  loadVehicles(): void { this.vehicleService.list().subscribe({ next: response => this.vehicles = response.data.filter(vehicle => vehicle.status === 'Active'), error: () => void Swal.fire({ title: 'Unable to load vehicles', text: 'Vehicles are unavailable for route assignment.', icon: 'warning' }) }); }

  loadData(): void {
    this.isLoading = true;
    this.collectionService.listAreas().subscribe({
      next: (areaResponse) => {
        this.areas = areaResponse.data;
        this.collectionService.listRoutes().subscribe({
          next: (routeResponse) => { this.routes = routeResponse.data; this.isLoading = false; },
          error: () => { this.isLoading = false; void this.loadError(); }
        });
      },
      error: () => { this.isLoading = false; void this.loadError(); }
    });
  }

  openAreaModal(content: TemplateRef<unknown>, area?: CollectionArea): void {
    this.editingArea = area ?? null;
    this.areaForm = area ? { area_code: area.area_code, name: area.name, description: area.description, location: area.location, latitude: area.latitude, longitude: area.longitude, place_id: area.place_id, service_model: area.service_model, contracting_organisation_id: area.contracting_organisation_id, status: area.status } : this.emptyAreaForm();
    const ref = this.modalService.open(content, { centered: true });
    ref.shown.subscribe(() => void this.initializeAreaLocationAutocomplete());
  }

  openRouteModal(content: TemplateRef<unknown>, route?: CollectionRoute): void {
    if (!route && !this.areas.length) {
      void Swal.fire({ title: 'Create an area first', text: 'Routes must belong to a collection area.', icon: 'info', confirmButtonColor: '#405189' });
      return;
    }
    this.editingRoute = route ?? null;
    this.routeForm = route
      ? { area_id: route.area_id, area_code: route.area_code, name: route.name, vehicle_id: route.vehicle_id, status: route.status }
      : this.emptyRouteForm();
    this.modalService.open(content, { centered: true });
  }

  onAreaSelected(): void {
    this.routeForm.area_code = this.areas.find((area) => area.id === this.routeForm.area_id)?.area_code ?? '';
  }
  onOrganisationSelection(value: string, content: TemplateRef<unknown>): void { if (value !== this.addOrganisationOption) return; this.areaForm.contracting_organisation_id = null; this.organisationForm = { name: '', commission_type: 'PERCENTAGE_OF_LUMP_SUM', commission_rate: null, contract_start_date: null, contract_end_date: null }; this.offcanvasService.open(content, { position: 'end', backdrop: false, panelClass: 'custom-subscription-offcanvas' }); }
  saveOrganisation(): void { this.collectionService.createContractingOrganisation(this.organisationForm).subscribe({ next: response => { const item = response.data[0]; this.organisations = [...this.organisations, item]; this.areaForm.contracting_organisation_id = item.id; this.showOrganisationForm = false; this.organisationForm = { name: '', commission_type: 'PERCENTAGE', commission_rate: null, contract_start_date: null, contract_end_date: null }; }, error: () => void Swal.fire({ title: 'Organisation could not be saved', icon: 'error' }) }); }

  saveArea(): void {
    const payload: CollectionAreaPayload = { ...this.areaForm, area_code: this.editingArea ? (this.areaForm.area_code ?? '').trim() : null, name: this.areaForm.name.trim(), description: this.areaForm.description?.trim() || null };
    this.isSaving = true;
    const request = this.editingArea ? this.collectionService.updateArea(this.editingArea.id, payload) : this.collectionService.createArea(payload);
    request.subscribe({
      next: () => this.saveSuccess(this.editingArea ? 'Area updated' : 'Area created'),
      error: (error) => this.saveFailure(error, this.editingArea ? 'The area could not be updated.' : 'The area could not be created.')
    });
  }

  saveRoute(): void {
    const payload: CollectionRoutePayload = { ...this.routeForm, name: this.routeForm.name.trim() };
    this.isSaving = true;
    const request = this.editingRoute ? this.collectionService.updateRoute(this.editingRoute.id, payload) : this.collectionService.createRoute(payload);
    request.subscribe({
      next: () => this.saveSuccess(this.editingRoute ? 'Route updated' : 'Route created'),
      error: (error) => this.saveFailure(error, this.editingRoute ? 'The route could not be updated.' : 'The route could not be created.')
    });
  }

  async deleteArea(area: CollectionArea): Promise<void> {
    const result = await this.confirmDelete('Delete area?', `${area.name} will be permanently deleted. Areas with routes cannot be deleted.`);
    if (!result) return;
    this.collectionService.deleteArea(area.id).subscribe({ next: () => this.deleteSuccess('Area deleted'), error: (error) => this.deleteFailure(error, 'The area may still have routes.') });
  }

  async deleteRoute(route: CollectionRoute): Promise<void> {
    const result = await this.confirmDelete('Delete route?', `${route.name} will be permanently deleted.`);
    if (!result) return;
    this.collectionService.deleteRoute(route.id).subscribe({ next: () => this.deleteSuccess('Route deleted'), error: (error) => this.deleteFailure(error, 'The route could not be deleted.') });
  }

  private saveSuccess(title: string): void {
    this.isSaving = false; this.modalService.dismissAll(); this.loadData();
    void Swal.fire({ title, text: 'Your changes were saved successfully.', icon: 'success', confirmButtonColor: '#0ab39c' });
  }
  private saveFailure(error: any, fallback: string): void {
    this.isSaving = false;
    const details = error?.error?.data?.map((item: any) => item.msg).filter(Boolean).join('; ');
    void Swal.fire({ title: 'Save failed', text: details || error?.error?.message || error?.message || fallback, icon: 'error', confirmButtonColor: '#f06548' });
  }
  private deleteSuccess(title: string): void {
    this.loadData(); void Swal.fire({ title, icon: 'success', confirmButtonColor: '#0ab39c' });
  }
  private deleteFailure(error: any, fallback: string): void {
    void Swal.fire({ title: 'Delete failed', text: error?.error?.message || fallback, icon: 'error', confirmButtonColor: '#f06548' });
  }
  private async confirmDelete(title: string, text: string): Promise<boolean> {
    const result = await Swal.fire({ title, text, icon: 'warning', showCancelButton: true, confirmButtonText: 'Yes, delete it', cancelButtonText: 'Cancel', confirmButtonColor: '#f06548', cancelButtonColor: '#74788d', reverseButtons: true });
    return result.isConfirmed;
  }
  private async loadError(): Promise<void> {
    const result = await Swal.fire({ title: 'Unable to load collection setup', text: 'Areas and routes could not be loaded. Please try again.', icon: 'error', showCancelButton: true, confirmButtonText: 'Retry', confirmButtonColor: '#405189', cancelButtonColor: '#74788d' });
    if (result.isConfirmed) this.loadData();
  }
  private emptyAreaForm(): CollectionAreaPayload { return { area_code: '', name: '', description: null, location: null, latitude: null, longitude: null, place_id: null, service_model: 'DIRECT', contracting_organisation_id: null, status: 'Active' }; }
  private emptyRouteForm(): CollectionRoutePayload { return { area_id: '', area_code: '', name: '', vehicle_id: null, status: 'Active' }; }

  private async initializeAreaLocationAutocomplete(): Promise<void> {
    const container = this.areaLocationAutocomplete?.nativeElement;
    if (!container || container.childElementCount || !this.googleMapsApiKeyConfigured) return;
    try {
      if (typeof google === 'undefined' || !google.maps) {
        await new Promise<void>((resolve, reject) => { const script = document.createElement('script'); script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(environment.googleMapsApiKey)}&loading=async&libraries=places&v=weekly`; script.async = true; script.onload = () => resolve(); script.onerror = () => reject(); document.head.appendChild(script); });
      }
      const places = await google.maps.importLibrary('places') as any;
      const autocomplete = new places.PlaceAutocompleteElement({ includedRegionCodes: ['ug'] });
      autocomplete.style.width = '100%';
      autocomplete.addEventListener('gmp-select', async (event: Event) => { const prediction = (event as any).placePrediction; const place = prediction.toPlace(); await place.fetchFields({ fields: ['id', 'formattedAddress', 'location'] }); this.areaForm.location = place.formattedAddress ?? prediction.text.toString(); this.areaForm.latitude = place.location?.lat() ?? null; this.areaForm.longitude = place.location?.lng() ?? null; this.areaForm.place_id = place.id ?? null; });
      container.appendChild(autocomplete);
    } catch { void Swal.fire({ title: 'Google locations unavailable', text: 'You can save the area without a mapped location.', icon: 'warning', confirmButtonColor: '#405189' }); }
  }
}
