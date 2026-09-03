import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  NgbToastModule, NgbProgressbarModule, NgbPaginationModule, NgbModalModule, NgbNavModule
} from '@ng-bootstrap/ng-bootstrap';

import { FlatpickrDirective } from 'angularx-flatpickr';
import { CountUpDirective } from 'ngx-countup';
import { NgApexchartsModule } from 'ng-apexcharts';
import { LeafletModule } from '@bluehalo/ngx-leaflet';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { SimplebarAngularModule } from 'simplebar-angular';
import { NgSelectModule } from '@ng-select/ng-select';

// Swiper Slider
import { SlickCarouselModule } from 'ngx-slick-carousel';

import { LightboxModule } from 'ngx-lightbox';

// Load Icons
import { defineElement } from "@lordicon/element";
import lottie from 'lottie-web';

// Pages Routing
import { PagesRoutingModule } from "./pages-routing.module";
import { SharedModule } from "../shared/shared.module";
import { DashboardsModule } from "./dashboards/dashboards.module";
import { AppsModule } from "./apps/apps.module";
import { CustomersComponent } from './customers/customers.component';
import { CompanySettingsComponent } from './company-settings/company-settings.component';
import { SubscriptionsComponent } from './subscriptions/subscriptions.component';
import { UsersComponent } from './users/users.component';
import { ContractsComponent } from './contracts/contracts.component';
import { AuthenticationSettingsComponent } from './authentication-settings/authentication-settings.component';
import { ClientCategoriesComponent } from './client-categories/client-categories.component';
import { PropertiesComponent } from './properties/properties.component';
import { CustomerReportsComponent } from './customer-reports/customer-reports.component';
import { CollectionSetupComponent } from './collection-setup/collection-setup.component';
// import { BlankPageComponent } from './blank-page/blank-page.component'; // Used by future placeholder-only routes.
import { StaffComponent } from './staff/staff.component';
import { VehiclesComponent } from './vehicles/vehicles.component';


@NgModule({
  declarations: [CustomersComponent, PropertiesComponent, CustomerReportsComponent, CompanySettingsComponent, SubscriptionsComponent, UsersComponent, ContractsComponent, AuthenticationSettingsComponent, ClientCategoriesComponent, CollectionSetupComponent, StaffComponent, VehiclesComponent],
  imports: [
    CommonModule,
    FormsModule,
    NgSelectModule,
    NgbToastModule,
    NgbProgressbarModule,
    NgbPaginationModule,
    NgbModalModule,
    NgbNavModule,
    FlatpickrDirective,
    CountUpDirective,
    NgApexchartsModule,
    LeafletModule,
    NgbDropdownModule,
    SimplebarAngularModule,
    PagesRoutingModule,
    SharedModule,
    SlickCarouselModule,
    LightboxModule,
    DashboardsModule,
    AppsModule
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class PagesModule {
  constructor() {
    defineElement();
  }
}
