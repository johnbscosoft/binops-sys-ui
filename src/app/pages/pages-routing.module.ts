import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
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
// import { BlankPageComponent } from './blank-page/blank-page.component'; // Restore with placeholder routes when their modules are implemented.
import { StaffComponent } from './staff/staff.component';
import { VehiclesComponent } from './vehicles/vehicles.component';
import { StaffDesignationsComponent } from './staff-designations/staff-designations.component';
import { SchedulesComponent } from './schedules/schedules.component';
import { DailyJobsComponent } from './daily-jobs/daily-jobs.component';
import { TodaysPickupsComponent } from './todays-pickups/todays-pickups.component';

const routes: Routes = [
    {
        path: "",
        pathMatch: "full",
        redirectTo: "crm"
    },
    {
      path: 'customers/list',
      component: CustomersComponent
    },
    {
      path: 'customers/properties',
      component: PropertiesComponent
    },
    {
      path: 'customers/contracts',
      component: ContractsComponent
    },
    {
      path: 'customers/reports/:type',
      component: CustomerReportsComponent
    },
    {
      path: 'customers/reports',
      redirectTo: 'customers/reports/summary',
      pathMatch: 'full'
    },
    {
      path: 'subscriptions/plans',
      component: SubscriptionsComponent
    },
    {
      path: 'collections/setup',
      component: CollectionSetupComponent
    },
    // Waste Collection placeholders retained in source but not exposed until implemented.
    // { path: 'collections/dashboard', component: BlankPageComponent },
    { path: 'collections/daily-jobs', component: DailyJobsComponent },
    { path: 'collections/todays-pickups', component: TodaysPickupsComponent },
    { path: 'collections/schedules', component: SchedulesComponent },
    { path: 'collections/fleet-crew', component: VehiclesComponent },
    // { path: 'collections/missed-collections', component: BlankPageComponent },
    // { path: 'collections/reports', component: BlankPageComponent },
    { path: 'vehicles/list', component: VehiclesComponent },
    { path: 'staff/management', component: StaffComponent },
    { path: 'staff/drivers', component: StaffComponent },
    { path: 'administration/designations', component: StaffDesignationsComponent },
    {
      path: 'administration/company-settings',
      component: CompanySettingsComponent
    },
    {
      path: 'administration/authentication-settings',
      component: AuthenticationSettingsComponent
    },
    {
      path: 'administration/client-categories',
      component: ClientCategoriesComponent
    },
    {
      path: 'administration/users',
      component: UsersComponent
    },
    {
      path: '', loadChildren: () => import('./dashboards/dashboards.module').then(m => m.DashboardsModule)
    },
    {
      path: 'apps', loadChildren: () => import('./apps/apps.module').then(m => m.AppsModule)
    },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PagesRoutingModule { }
