/**
 * Message Template Types for Quick-Reply System
 */

/**
 * Message template stored in database
 */
export interface MessageTemplate {
  id: string;
  user_id: string;
  name: string;
  content: string;
  message_type: string | null;
  is_system_template: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

/**
 * Type for inserting new templates
 */
export type MessageTemplateInsert = Omit<MessageTemplate, 'id' | 'created_at' | 'updated_at' | 'is_system_template'> & {
  is_system_template?: boolean;
};

/**
 * Type for updating templates
 */
export type MessageTemplateUpdate = Partial<Omit<MessageTemplate, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'is_system_template'>>;

/**
 * Default system templates for landscapers
 */
export const DEFAULT_LANDSCAPER_TEMPLATES: Omit<MessageTemplate, 'id' | 'user_id' | 'created_at' | 'updated_at'>[] = [
  {
    name: 'On My Way',
    content: 'On my way, ETA 15 minutes.',
    message_type: 'arrival_update',
    is_system_template: true,
    sort_order: 1
  },
  {
    name: 'Arrived',
    content: 'Arrived on site and getting started.',
    message_type: 'arrival_update',
    is_system_template: true,
    sort_order: 2
  },
  {
    name: 'Work Completed',
    content: 'Work completed. Please review the photos.',
    message_type: 'completion_note',
    is_system_template: true,
    sort_order: 3
  },
  {
    name: 'Running Behind',
    content: 'Running slightly behind schedule, will update shortly with new ETA.',
    message_type: 'delay_notification',
    is_system_template: true,
    sort_order: 4
  },
  {
    name: 'Quick Question',
    content: 'I have a quick question about the job.',
    message_type: 'scope_clarification',
    is_system_template: true,
    sort_order: 5
  },
  {
    name: 'Access Question',
    content: 'Could you please provide access instructions or gate code?',
    message_type: 'property_access',
    is_system_template: true,
    sort_order: 6
  },
  {
    name: 'Material Confirmation',
    content: 'Just confirming the materials before I proceed.',
    message_type: 'material_confirmation',
    is_system_template: true,
    sort_order: 7
  },
  {
    name: 'Weather Delay',
    content: 'Due to weather conditions, I need to reschedule. I will reach out with available times.',
    message_type: 'delay_notification',
    is_system_template: true,
    sort_order: 8
  }
];

/**
 * Default system templates for clients
 */
export const DEFAULT_CLIENT_TEMPLATES: Omit<MessageTemplate, 'id' | 'user_id' | 'created_at' | 'updated_at'>[] = [
  {
    name: 'Thanks',
    content: 'Thanks for the update!',
    message_type: 'answer_question',
    is_system_template: true,
    sort_order: 1
  },
  {
    name: 'Approved',
    content: 'Approved, please proceed.',
    message_type: 'approve_clarification',
    is_system_template: true,
    sort_order: 2
  },
  {
    name: 'Will Review',
    content: 'I will review and follow up shortly.',
    message_type: 'answer_question',
    is_system_template: true,
    sort_order: 3
  },
  {
    name: 'Delay Acknowledged',
    content: 'No problem, thanks for letting me know.',
    message_type: 'acknowledge_delay',
    is_system_template: true,
    sort_order: 4
  },
  {
    name: 'Gate Code',
    content: 'The gate code is [CODE]. Please let me know if you have any issues.',
    message_type: 'answer_question',
    is_system_template: true,
    sort_order: 5
  },
  {
    name: 'Looks Great',
    content: 'Looks great, thank you for the excellent work!',
    message_type: 'answer_question',
    is_system_template: true,
    sort_order: 6
  }
];

/**
 * Maximum number of custom templates per user
 */
export const MAX_CUSTOM_TEMPLATES = 20;

/**
 * Maximum template content length
 */
export const MAX_TEMPLATE_CONTENT_LENGTH = 500;

/**
 * Maximum template name length
 */
export const MAX_TEMPLATE_NAME_LENGTH = 50;
