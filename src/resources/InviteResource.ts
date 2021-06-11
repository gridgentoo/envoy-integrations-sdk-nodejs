import JSONAPIModel from '../util/json-api/JSONAPIModel';

/**
 * @category API Resource
 */
export type InviteSortFields = 'name' | 'created_at' | '-name' | '-created_at';

/**
 * @category API Resource
 */
export interface InviteFilterFields {
  email?: string;
  employee?: string;
  flow?: string;
  location?: string;
  'date-from'?: string;
  'date-to'?: string;
  'datetime-from'?: string;
  'datetime-to'?: string;
  'for-date'?: string;
  'employee-centric'?: boolean;
  scope?: 'hosted' | 'mine' | 'include_execs';
}

/**
 * @category API Resource
 */
export interface InviteAttributes {
  'additional-guests'?: number;
  'approval-status'?: {
    status: 'approved' | 'review' | 'pending' | 'denied';
    auto_approved: boolean;
    report: Array<{
      reason: string;
      result: 'pass' | 'fail' | 'pending',
      source: string,
      messages: {
        failure?: {
          text: string,
          header: string,
        }
      }
    }>
  };
  email?: string;
  'expected-arrival-time'?: string;
  'expected-departure-time'?: string;
  'full-name'?: string;
  'guest-updated-at'?: string;
  'is-presigned'?: boolean;
  'private-notes'?: string;
  'user-data'?: Record<string, string | null>;
  'notify-visitor'?: boolean;
  'created-from'?: string;
  arrived?: boolean;
  attested?: boolean;
  'entry-signed-out-at'?: string;
  'reminder-sent-at'?: string;
  phone?: string;
  'created-at'?: string;
  'updated-at'?: string;
}

/**
 * @category API Resource
 */
export interface InviteCreationAttributes {
  email?: string;
  'expected-arrival-time'?: string;
  'expected-departure-time'?: string;
  'full-name'?: string;
  'private-notes'?: string;
  'user-data'?: Record<string, string | null>;
  'notify-visitor'?: boolean;
  attested?: boolean;
  phone?: string;
}

/**
 * @category API Resource
 */
export type InviteRelationships = 'attendee' | 'creator' | 'employee' | 'entry' | 'flow' | 'location';

/**
 * @category API Resource
 */
export type InviteModel = JSONAPIModel<InviteAttributes, InviteRelationships, 'invites'>;

/**
 * @category API Resource
 */
export type InviteCreationModel = JSONAPIModel<InviteCreationAttributes, InviteRelationships, 'invites', undefined>;
