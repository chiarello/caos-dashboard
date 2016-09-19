import { NgModule, LOCALE_ID }  from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpModule  } from '@angular/http';
import { FormsModule } from '@angular/forms';

import { Ng2BootstrapModule } from 'ng2-bootstrap/ng2-bootstrap';
import { PopoverModule } from 'ng2-popover';

import { nvD3 } from 'ng2-nvd3';

import * as d3 from 'd3';
import * as nv from 'nvd3';

import { SETTINGS } from './settings';
import { CAOS_ROUTING } from './app.routing';

import { AppComponent } from './app.component';
import { SeriesGraphComponent } from './series-graph.component';
import { RangeComponent } from './range.component';

import { HomeComponent } from './home.component';
import { AccountingComponent } from './accounting.component';

@NgModule({
  declarations: [
    AppComponent,
    RangeComponent,
    HomeComponent,
    AccountingComponent,
    SeriesGraphComponent,
    nvD3
  ],
  imports: [
    BrowserModule,
    HttpModule,
    FormsModule,
    Ng2BootstrapModule,
    PopoverModule,
    CAOS_ROUTING
  ],
  providers: [
    { provide: LOCALE_ID, useValue: SETTINGS.LOCALE },
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}