import axios from 'axios';
import qs from 'qs';
import DataLoader from 'dataloader';

/**
 * JSON-API generic types
 */
import JSONAPIPaginationParams from './util/json-api/JSONAPIPaginationParams';
import JSONAPIData from './util/json-api/JSONAPIData';

/**
 * Envoy Web's JSON-API Resources
 */
import { AgreementPageModel } from './resources/AgreementPageResource';
import { AgreementModel } from './resources/AgreementResource';
import { CompanyModel } from './resources/CompanyResource';
import { EmployeeFilterFields, EmployeeModel, EmployeeSortFields } from './resources/EmployeeResource';
import { FlowFilterFields, FlowModel, FlowSortFields } from './resources/FlowResource';
import {
  InviteCreationModel, InviteFilterFields, InviteModel, InviteSortFields,
} from './resources/InviteResource';
import { LocationFilterFields, LocationModel, LocationSortFields } from './resources/LocationResource';
import { SignInFieldModel } from './resources/SignInFieldResource';
import { SignInFieldPageModel } from './resources/SignInFieldPageResource';
import { UserModel } from './resources/UserResource';

import { envoyBaseURL, envoyClientId, envoyClientSecret } from './constants';
import EnvoyPluginJobUpdate from './EnvoyPluginJobUpdate';
import { EnvoyMetaAuth } from './EnvoyMeta';
import EnvoyStorageCommand from './EnvoyStorageCommand';
import EnvoyStorageItem from './EnvoyStorageItem';

interface EnvoyWebDataLoaderKey extends JSONAPIData {
  include?: string;
}

/**
 * Sometimes envoy-web will give us back some relationship data
 * with the "type" set to the relationships name instead of the actual model's name.
 * This mapping allows us to alias those cases.
 */
const TYPE_ALIASES = new Map<string, string>([
  ['employee-screening-flows', 'flows'],
]);

/**
 * Make typed API calls to Envoy Web.
 * Uses a data loader to leverage JSONAPI's "include" functionality.
 * This allows us to save everything that was included in the initial response
 * to be used later without re-fetching from the API.
 */
export default class EnvoyAPI {
  /**
   * HTTP Client
   */
  readonly axios = axios.create({
    baseURL: envoyBaseURL,
    headers: {
      'Content-Type': 'application/vnd.api+json',
      Accept: 'application/vnd.api+json',
    },
    paramsSerializer: (params) => qs.stringify(params, {
      arrayFormat: 'brackets',
      encode: false,
    }),
  });

  /**
   * A dataloader: https://github.com/graphql/dataloader
   * Will fetch individual resources from the API,
   * unless they exist in cache (which they usually will).
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly dataLoader = new DataLoader<EnvoyWebDataLoaderKey, any, string>(
    (keys) => Promise.all(
      keys.map(async ({ type, id, include }) => {
        const { data } = await this.axios.get(`api/v3/${type}/${id}`, { params: { include } });
        return data.data;
      }),
    ),
    {
      cacheKeyFn: (key) => `${key.type}_${key.id}`,
    },
  );

  constructor(accessToken: string) {
    this.axios.defaults.headers.authorization = `Bearer ${accessToken}`;
    /**
     * Saves every model that was "include"ed in the response,
     * which saves us the trouble of fetching related data.
     */
    this.axios.interceptors.response.use((response) => {
      const {
        data: {
          data: modelOrModels,
          included,
        },
      } = response;

      (included || [])
        .concat(modelOrModels)
        .forEach((model: JSONAPIData) => {
          this.dataLoader.prime({ type: model.type, id: model.id }, model);
          const alias = TYPE_ALIASES.get(model.type);
          if (alias) {
            this.dataLoader.prime({ type: alias, id: model.id }, model);
          }
        });
      return response;
    }, (error) => Promise.reject(error));
  }

  async getAgreementPage(id: string, include?: string): Promise<AgreementPageModel> {
    return this.dataLoader.load({ type: 'agreement-pages', id, include });
  }

  async getAgreement(id: string, include?: string): Promise<AgreementModel> {
    return this.dataLoader.load({ type: 'agreements', id, include });
  }

  async getCompany(id: string, include?: string): Promise<CompanyModel> {
    return this.dataLoader.load({ type: 'companies', id, include });
  }

  async getEmployee(id: string, include?: string): Promise<EmployeeModel> {
    return this.dataLoader.load({ type: 'employees', id, include });
  }

  async getFlow(id: string, include?: string): Promise<FlowModel> {
    return this.dataLoader.load({ type: 'flows', id, include });
  }

  async getLocation(id: string, include?: string): Promise<LocationModel> {
    return this.dataLoader.load({ type: 'locations', id, include });
  }

  async getSignInFieldPage(id: string, include?: string): Promise<SignInFieldPageModel> {
    return this.dataLoader.load({ type: 'sign-in-field-pages', id, include });
  }

  async getSignInField(id: string, include?: string): Promise<SignInFieldModel> {
    return this.dataLoader.load({ type: 'sign-in-fields', id, include });
  }

  async getEmployeeByEmail(email: string, include?: string): Promise<EmployeeModel> {
    const paginationParams: JSONAPIPaginationParams<EmployeeFilterFields, EmployeeSortFields> = {
      filter: {
        email,
      },
      page: {
        limit: 1,
      },
    };
    const { data: { data: [employee] } } = await this.axios.get('/api/v3/employees', {
      params: {
        include,
        ...paginationParams,
      },
    });

    return employee;
  }

  async getEmployees(
    params?: JSONAPIPaginationParams<EmployeeFilterFields, EmployeeSortFields>,
  ): Promise<Array<EmployeeModel>> {
    const { data } = await this.axios.get('/api/v3/employees', { params });
    return data.data;
  }

  async getFlows(params?: JSONAPIPaginationParams<FlowFilterFields, FlowSortFields>): Promise<Array<FlowModel>> {
    const { data } = await this.axios.get('/api/v3/flows', { params });
    return data.data;
  }

  async getLocations(
    params?: JSONAPIPaginationParams<LocationFilterFields, LocationSortFields>,
  ): Promise<Array<LocationModel>> {
    const { data } = await this.axios.get('/api/v3/locations', { params });
    return data.data;
  }

  async getSignInFields(signInFieldPageId: string): Promise<Array<SignInFieldModel>> {
    const { data } = await this.axios.get(`/api/v3/sign-in-field-pages/${signInFieldPageId}/sign-in-fields`);
    return data.data;
  }

  async getInvites(
    params?: JSONAPIPaginationParams<InviteFilterFields, InviteSortFields>,
  ): Promise<Array<InviteModel>> {
    const { data } = await this.axios.get('/api/v3/invites', { params });
    return data.data;
  }

  async me(): Promise<UserModel> {
    const { data } = await this.axios.get('/api/v2/users/me');
    return data.data;
  }

  async createInvite(invite: InviteCreationModel): Promise<InviteModel> {
    const { data } = await this.axios({
      method: 'POST',
      url: '/api/v3/invites',
      data: { data: invite },
    });
    return data.data;
  }

  async updateInvite(inviteId: string, invite: InviteCreationModel): Promise<InviteModel> {
    const { data } = await this.axios({
      method: 'PUT',
      url: `/api/v3/invites/${inviteId}`,
      data: { data: { ...invite, id: inviteId } },
    });

    return data.data;
  }

  async partialUpdateInvite(inviteId: string, invite: InviteCreationModel): Promise<InviteModel> {
    const { data } = await this.axios({
      method: 'PATCH',
      url: `/api/v3/invites/${inviteId}`,
      data: { data: { ...invite, id: inviteId } },
    });

    return data.data;
  }

  async removeInvite(inviteId: string): Promise<void> {
    await this.axios({
      method: 'DELETE',
      url: `/api/v3/invites/${inviteId}`,
    });
  }

  async updateJob(jobId: string, update: EnvoyPluginJobUpdate): Promise<void> {
    await this.axios({
      method: 'PATCH',
      url: `/api/v2/plugin-services/jobs/${jobId}`,
      data: update,
    });
  }

  async getPluginInstallConfig(installId: string): Promise<Record<string, any>> {
    const { data } = await this.axios.get(`/api/v2/plugin-services/installs/${installId}/config`);
    return data.data;
  }

  async setPluginInstallConfig(installId: string, config: Record<string, any>): Promise<void> {
    await this.axios({
      method: 'PUT',
      url: `/api/v2/plugin-services/installs/${installId}/config`,
      data: config,
    });
  }

  async storagePipeline(
    commands: Array<EnvoyStorageCommand>,
    installId?: string,
  ): Promise<Array<EnvoyStorageItem | null>> {
    const request: Record<string, any> = { commands };
    if (installId) {
      request.install_id = installId;
    }
    const { data } = await this.axios({
      method: 'POST',
      url: '/api/v2/plugin-services/storage',
      data: request,
    });
    return data.data;
  }

  async createNotification(installId: string, params = {}): Promise<void> {
    await this.axios({
      method: 'POST',
      url: `/api/v2/plugin-services/installs/${installId}/notifications`,
      data: params,
    });
  }

  /**
   * Gets an access token using client_credentials as the grant type.
   */
  static async login(id = envoyClientId, secret = envoyClientSecret): Promise<EnvoyMetaAuth> {
    const { data } = await axios({
      auth: {
        username: id,
        password: secret,
      },
      method: 'POST',
      data: {
        grant_type: 'client_credentials',
        client_id: id,
        client_secret: secret,
        scope: 'plugin,token.refresh',
      },
      url: '/a/auth/v0/token',
      baseURL: envoyBaseURL,
    });
    return data;
  }

  static async loginAsUser(
    username: string,
    password: string,
    id = envoyClientId,
    secret = envoyClientSecret,
  ): Promise<EnvoyMetaAuth> {
    const { data } = await axios({
      auth: {
        username: id,
        password: secret,
      },
      method: 'POST',
      data: {
        grant_type: 'password',
        username,
        password,
        scope: 'plugin,token.refresh',
      },
      url: '/a/auth/v0/token',
      baseURL: envoyBaseURL,
    });
    return data;
  }

  static async loginAsPluginInstaller(
    installId: string,
    id = envoyClientId,
    secret = envoyClientSecret,
  ): Promise<EnvoyMetaAuth> {
    const { data } = await axios({
      auth: {
        username: id,
        password: secret,
      },
      method: 'POST',
      data: {
        grant_type: 'plugin_install',
        install_id: installId,
      },
      url: '/a/auth/v0/token',
      baseURL: envoyBaseURL,
    });
    return data;
  }
}
