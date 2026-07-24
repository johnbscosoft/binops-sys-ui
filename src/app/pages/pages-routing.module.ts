import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CustomersComponent } from './customers/customers.component';
import { CompanySettingsComponent } from './company-settings/company-settings.component';
import { SubscriptionsComponent } from './subscriptions/subscriptions.component';
import { UsersComponent } from './users/users.component';
import { ContractsComponent } from './contracts/contracts.component';
import { AuthenticationSettingsComponent } from './authentication-settings/authentication-settings.component';

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
      path: 'customers/contracts',
      component: ContractsComponent
    },
    {
      path: 'subscriptions/plans',
      component: SubscriptionsComponent
    },
    {
      path: 'administration/company-settings',
      component: CompanySettingsComponent
    },
    {
      path: 'administration/authentication-settings',
      component: AuthenticationSettingsComponent
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
