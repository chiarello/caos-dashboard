////////////////////////////////////////////////////////////////////////////////
//
// caos-dashboard - CAOS dashboard
//
// Copyright © 2016, 2017 INFN - Istituto Nazionale di Fisica Nucleare (Italy)
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//
//
// Author: Fabrizio Chiarello <fabrizio.chiarello@pd.infn.it>
//
////////////////////////////////////////////////////////////////////////////////

import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/mergeMap';

import { ApiService, Status } from './api.service';
import { SETTINGS } from './settings';
import { b64EncodeUnicode } from './utils';

@Injectable()
export class AuthService {
  private _token_key: string;

  constructor(private _api: ApiService) {
    this._token_key = this.build_key("token");

    let token = sessionStorage.getItem(this._token_key);
    if (token) {
      this.set_token(token);
    }
  }

  private build_key(key: string): string {
    return b64EncodeUnicode(`${SETTINGS.CAOS_SITE_NAME}_${key}`);
  }

  private set_token(token: string) {
    sessionStorage.setItem(this._token_key, token);
    this._api.set_token(token);
  }

  status(): Observable<boolean> {
    return this._api.status()
      .map((status: Status) => status.auth);
  }

  login(username: string, password: string): Observable<boolean> {
    let token = this._api.token(username, password);

    return token.flatMap(
      (token: string) => {
        this.set_token(token);
        return this.status();
      });
  }

  logout() {
    sessionStorage.removeItem(this._token_key);
    this._api.set_token(null);
  }
}
