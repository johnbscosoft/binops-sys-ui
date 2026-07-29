import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

// Component Pages
import { CrmComponent } from "./crm/crm.component";

const routes: Routes = [
  {
    path: "crm",
    component: CrmComponent
  },
  {
    path: "dashboard/overview",
    component: CrmComponent
  },
  {
    path: "dashboard/key-metrics",
    component: CrmComponent
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})

export class DashboardsRoutingModule { }
