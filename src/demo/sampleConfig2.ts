import type { KeyConfig } from "../core/types";
export const ACCOUNT_FIELDS: KeyConfig[] = [
    // ----- account.* — direct account fields -----

    {
        key: 'account.internalID',
        label: 'Internal ID',
        description: 'Unique account identifier; join key between accounts and conversation_accounts.',
        valueType: 'string',
        esField: 'internalID',
        queryType: 'term',
        allowedOperators: ['=', '!=', 'IN']
    },

    {
        key: 'account.origID',
        label: 'Origin ID',
        description: 'Upstream-system identifier (no longer used for joins).',
        valueType: 'string',
        esField: 'origID',
        queryType: 'term',
        allowedOperators: ['=', '!=', 'IN']
    },

    {
        key: 'account.userName',
        label: 'Username',
        valueType: 'string',
        esField: 'userName',
        queryType: 'term',
        allowedOperators: ['=', '!=', 'IN']
    },

    {
        key: 'account.name',
        label: 'Name',
        description: 'Free-text name. Use ":" for diacritic-folded match.',
        valueType: 'string',
        esField: 'name',
        queryType: 'match',
        allowedOperators: ['=', '!=', ':', 'IN']
    },

    {
        key: 'account.name.keyword',
        label: 'Name (exact / wildcard)',
        description: 'Wildcard / exact-string match against name.keyword. Use * and ? as wildcards.',
        valueType: 'string',
        esField: 'name.keyword',
        queryType: 'wildcard',
        allowedOperators: ['=']
    },

    {
        key: 'account.displayName',
        label: 'Display name',
        valueType: 'string',
        esField: 'displayName',
        queryType: 'match',
        allowedOperators: ['=', '!=', ':', 'IN']
    },

    {
        key: 'account.displayName.keyword',
        label: 'Display name (exact / wildcard)',
        valueType: 'string',
        esField: 'displayName.keyword',
        queryType: 'wildcard',
        allowedOperators: ['=']
    },

    {
        key: 'account.phoneNumber',
        label: 'Phone number',
        description: 'Quote values containing parentheses or spaces.',
        valueType: 'string',
        esField: 'phoneNumber',
        queryType: 'term',
        allowedOperators: ['=', '!=', 'IN']
    },

    {
        key: 'account.birthday',
        label: 'Birthday',
        valueType: 'date',
        esField: 'birthday',
        queryType: 'term',
        allowedOperators: ['=', '!=', '>', '>=', '<', '<=']
    },

    {
        key: 'account.gender',
        label: 'Gender',
        valueType: 'number',
        esField: 'gender',
        queryType: 'term',
        allowedOperators: ['=', '!=', 'IN']
    },

    {
        key: 'account.alias',
        label: 'Alias',
        valueType: 'string',
        esField: 'alias',
        queryType: 'match',
        allowedOperators: ['=', '!=', ':', 'IN']
    },

    {
        key: 'account.alias.keyword',
        label: 'Alias (exact / wildcard)',
        valueType: 'string',
        esField: 'alias.keyword',
        queryType: 'wildcard',
        allowedOperators: ['=']
    },

    {
        key: 'account.createdBy',
        label: 'Created by',
        valueType: 'number',
        esField: 'createdBy',
        queryType: 'term',
        allowedOperators: ['=', '!=', 'IN']
    },

    {
        key: 'account.updatedBy',
        label: 'Updated by',
        valueType: 'number',
        esField: 'updatedBy',
        queryType: 'term',
        allowedOperators: ['=', '!=', 'IN']
    },

    {
        key: 'account.createdTime',
        label: 'Created time',
        description: 'ISO 8601 string or date-math expression.',
        valueType: 'date',
        esField: 'createdTime',
        queryType: 'term',
        allowedOperators: ['=', '!=', '>', '>=', '<', '<=']
    },

    {
        key: 'account.updatedTime',
        label: 'Updated time',
        valueType: 'date',
        esField: 'updatedTime',
        queryType: 'term',
        allowedOperators: ['=', '!=', '>', '>=', '<', '<=']
    },

    {
        key: 'account.appID',
        label: 'App ID',
        valueType: 'number',
        esField: 'appID',
        queryType: 'term',
        allowedOperators: ['=', '!=', 'IN']
    },

    {
        key: 'account.argument',
        label: 'Argument',
        valueType: 'string',
        esField: 'argument',
        queryType: 'term',
        allowedOperators: ['=', '!=', 'IN']
    },

    {
        key: 'account.socksID',
        label: 'Socks ID',
        valueType: 'number',
        esField: 'socksID',
        queryType: 'term',
        allowedOperators: ['=', '!=', 'IN']
    },

    {
        key: 'account.crawlGroupID',
        label: 'Crawl group ID',
        valueType: 'number',
        esField: 'crawlGroupID',
        queryType: 'term',
        allowedOperators: ['=', '!=', 'IN']
    },

    {
        key: 'account.disabled',
        label: 'Disabled',
        description: 'Default filter excludes disabled records; query explicitly to include them.',
        valueType: 'boolean',
        esField: 'disabled',
        queryType: 'term',
        allowedOperators: ['=', '!=']
    },

    {
        key: 'account.lastBuildGraphTime',
        label: 'Last build graph',
        valueType: 'date',
        esField: 'lastBuildGraphTime',
        queryType: 'term',
        allowedOperators: ['=', '!=', '>', '>=', '<', '<=']
    },

    // ----- category.* — sub-namespace; physical fields live on accounts -----

    {
        key: 'category.id',
        label: 'Category ID',
        description: 'Primary category. Combined with category.ids when filtering.',
        valueType: 'number',
        esField: 'categoryID',
        queryType: 'term',
        allowedOperators: ['=', '!=', 'IN']
    },

    {
        key: 'category.name',
        label: 'Category name',
        valueType: 'string',
        esField: 'categoryName',
        queryType: 'match',
        allowedOperators: ['=', '!=', ':', 'IN']
    },

    {
        key: 'category.name.keyword',
        label: 'Category name (exact / wildcard)',
        valueType: 'string',
        esField: 'categoryName.keyword',
        queryType: 'wildcard',
        allowedOperators: ['=']
    },

    {
        key: 'category.ids',
        label: 'Category IDs',
        description: 'Additional categories the account belongs to.',
        valueType: 'number',
        esField: 'categoryIDs',
        queryType: 'term',
        allowedOperators: ['=', '!=', 'IN']
    },

    {
        key: 'category.names',
        label: 'Category names',
        valueType: 'string',
        esField: 'categoryNames',
        queryType: 'match',
        allowedOperators: ['=', '!=', ':', 'IN']
    },

    {
        key: 'category.names.keyword',
        label: 'Category names (exact / wildcard)',
        valueType: 'string',
        esField: 'categoryNames.keyword',
        queryType: 'wildcard',
        allowedOperators: ['=']
    },
    {
        key: 'account.indexedTime',
        label: 'Indexed time',
        description: 'When the account document was indexed.',
        valueType: 'date',
        esField: 'indexedTime',
        queryType: 'term',
        allowedOperators: ['=', '!=', '>', '>=', '<', '<=']
    },
];

export const CONVERSATION_FIELDS: KeyConfig[] = [
    {
        key: 'conversation.accountID',
        label: 'Account ID',
        valueType: 'number',
        esField: 'accountID',
        queryType: 'term',
        allowedOperators: ['=', '!=', 'IN']
    },

    {
        key: 'conversation.id',
        label: 'Conversation ID',
        valueType: 'string',
        esField: 'conversationID',
        queryType: 'term',
        allowedOperators: ['=', '!=', 'IN']
    },

    {
        key: 'conversation.name',
        label: 'Name',
        description: 'Conversation participant name. Use ":" for diacritic-folded match.',
        valueType: 'string',
        esField: 'name',
        queryType: 'match',
        allowedOperators: ['=', '!=', ':', 'IN']
    },

    {
        key: 'conversation.name.keyword',
        label: 'Name (exact / wildcard)',
        valueType: 'string',
        esField: 'name.keyword',
        queryType: 'wildcard',
        allowedOperators: ['=']
    },

    {
        key: 'conversation.internalID',
        label: 'Internal ID',
        valueType: 'string',
        esField: 'internalID',
        queryType: 'term',
        allowedOperators: ['=', '!=', 'IN']
    },

    {
        key: 'conversation.origID',
        label: 'Origin ID',
        valueType: 'string',
        esField: 'origID',
        queryType: 'term',
        allowedOperators: ['=', '!=', 'IN']
    },

    {
        key: 'conversation.priority',
        label: 'Priority',
        valueType: 'number',
        esField: 'priority',
        queryType: 'term',
        allowedOperators: ['=', '!=', '>', '>=', '<', '<=', 'IN']
    },

    {
        key: 'conversation.resourceID',
        label: 'Resource ID',
        valueType: 'number',
        esField: 'resourceID',
        queryType: 'term',
        allowedOperators: ['=', '!=', 'IN']
    },

    {
        key: 'conversation.updatedBy',
        label: 'Updated by',
        valueType: 'number',
        esField: 'updatedBy',
        queryType: 'term',
        allowedOperators: ['=', '!=', 'IN']
    },

    {
        key: 'conversation.updatedTime',
        label: 'Updated time',
        valueType: 'date',
        esField: 'updatedTime',
        queryType: 'term',
        allowedOperators: ['=', '!=', '>', '>=', '<', '<=']
    }, {
        key: 'conversation.indexedTime',
        label: 'Indexed time',
        description: 'When the conversation_account document was indexed.',
        valueType: 'date',
        esField: 'indexedTime',
        queryType: 'term',
        allowedOperators: ['=', '!=', '>', '>=', '<', '<=']
    },
];

export const MESSAGE_FIELDS: KeyConfig[] = [
    {
        key: 'message.origID',
        label: 'Origin ID',
        valueType: 'string',
        esField: 'origID',
        queryType: 'term',
        allowedOperators: ['=', '!=', 'IN']
    },

    {
        key: 'message.sequence',
        label: 'Sequence',
        valueType: 'number',
        esField: 'sequence',
        queryType: 'term',
        allowedOperators: ['=', '!=', '>', '>=', '<', '<=', 'IN']
    },

    {
        key: 'message.conversationID',
        label: 'Conversation ID',
        description: 'Also required as a query parameter on /search/messages.',
        valueType: 'string',
        esField: 'conversationID',
        queryType: 'term',
        allowedOperators: ['=', '!=', 'IN']
    },

    {
        key: 'message.appID',
        label: 'App ID',
        valueType: 'number',
        esField: 'appID',
        queryType: 'term',
        allowedOperators: ['=', '!=', 'IN']
    },

    {
        key: 'message.conversationType',
        label: 'Conversation type',
        description: 'Distinguishes group (=2) from direct messages.',
        valueType: 'number',
        esField: 'conversationType',
        queryType: 'term',
        allowedOperators: ['=', '!=', 'IN'],
        staticSuggestions: [
            { value: '2', label: 'Group', description: 'conversationType=2 — group conversation' },
        ]
    },

    {
        key: 'message.contentType',
        label: 'Content type',
        valueType: 'number',
        esField: 'contentType',
        queryType: 'term',
        allowedOperators: ['=', '!=', 'IN'],
        staticSuggestions: [
            { value: '1', label: 'Text', description: 'contentType=1 — text message' },
            { value: '2', label: 'Sticker', description: 'contentType=2 — sticker message' },
            { value: '3', label: 'Image', description: 'contentType=3 — image message' },
            { value: '4', label: 'Video', description: 'contentType=4 — video message' },
            { value: '5', label: 'Audio', description: 'contentType=5 — audio message' },
            { value: '6', label: 'Location', description: 'contentType=6 — location message' },
            { value: '7', label: 'File', description: 'contentType=7 — file message' },
        ]
    },

    {
        key: 'message.content',
        label: 'Content',
        description: 'Message body. Use ":" for diacritic-folded match. Highlighted in responses.',
        valueType: 'string',
        esField: 'content',
        queryType: 'match',
        allowedOperators: ['=', '!=', ':', 'IN']
    },

    {
        key: 'message.content.keyword',
        label: 'Content (exact / wildcard)',
        description: 'Wildcard / exact-string match against content.keyword. Use * and ? as wildcards.',
        valueType: 'string',
        esField: 'content.keyword',
        queryType: 'wildcard',
        allowedOperators: ['=']
    },

    {
        key: 'message.fromOrigID',
        label: 'From (origID)',
        valueType: 'string',
        esField: 'fromOrigID',
        queryType: 'term',
        allowedOperators: ['=', '!=', 'IN']
    },

    {
        key: 'message.toOrigID',
        label: 'To (origID)',
        valueType: 'string',
        esField: 'toOrigID',
        queryType: 'term',
        allowedOperators: ['=', '!=', 'IN']
    },

    {
        key: 'message.fromInternalID',
        label: 'From (internalID)',
        description: 'Sender account internalID; same key space as account.internalID.',
        valueType: 'string',
        esField: 'fromInternalID',
        queryType: 'term',
        allowedOperators: ['=', '!=', 'IN']
    },

    {
        key: 'message.toInternalID',
        label: 'To (internalID)',
        description: 'Recipient account internalID for direct messages; group ID when conversationType=2.',
        valueType: 'string',
        esField: 'toInternalID',
        queryType: 'term',
        allowedOperators: ['=', '!=', 'IN']
    },


    {
        key: 'message.disabled',
        label: 'Disabled',
        description: 'Default filter excludes disabled messages; query explicitly to include them.',
        valueType: 'boolean',
        esField: 'disabled',
        queryType: 'term',
        allowedOperators: ['=', '!=']
    },

    {
        key: 'message.attachmentExtension',
        label: 'Attachment extension',
        description: 'File extension (e.g. pdf, docx).',
        valueType: 'string',
        esField: 'attachmentExtension',
        queryType: 'match',
        allowedOperators: ['=', '!=', ':', 'IN']
    },

    {
        key: 'message.attachmentExtension.keyword',
        label: 'Attachment extension (exact / wildcard)',
        valueType: 'string',
        esField: 'attachmentExtension.keyword',
        queryType: 'wildcard',
        allowedOperators: ['=']
    },

    {
        key: 'message.attachmentContent',
        label: 'Attachment content',
        description: 'Extracted document text. Highlighted in responses.',
        valueType: 'string',
        esField: 'attachmentContent',
        queryType: 'match',
        allowedOperators: ['=', '!=', ':', 'IN']
    },

    {
        key: 'message.attachmentContent.keyword',
        label: 'Attachment content (exact / wildcard)',
        valueType: 'string',
        esField: 'attachmentContent.keyword',
        queryType: 'wildcard',
        allowedOperators: ['=']
    },

    {
        key: 'message.attachmentName',
        label: 'Attachment name',
        description: 'Original file name. Highlighted in responses.',
        valueType: 'string',
        esField: 'attachmentName',
        queryType: 'match',
        allowedOperators: ['=', '!=', ':', 'IN']
    },

    {
        key: 'message.attachmentName.keyword',
        label: 'Attachment name (exact / wildcard)',
        valueType: 'string',
        esField: 'attachmentName.keyword',
        queryType: 'wildcard',
        allowedOperators: ['=']
    },

    {
        key: 'message.attachmentErrorMessage',
        label: 'Attachment error message',
        valueType: 'string',
        esField: 'attachmentErrorMessage',
        queryType: 'match',
        allowedOperators: ['=', '!=', ':', 'IN']
    },

    {
        key: 'message.attachmentErrorMessage.keyword',
        label: 'Attachment error message (exact / wildcard)',
        valueType: 'string',
        esField: 'attachmentErrorMessage.keyword',
        queryType: 'wildcard',
        allowedOperators: ['=']
    },

    {
        key: 'message.attachmentUpdatedTime',
        label: 'Attachment updated',
        valueType: 'date',
        esField: 'attachmentUpdatedTime',
        queryType: 'term',
        allowedOperators: ['=', '!=', '>', '>=', '<', '<=']
    },

    {
        key: 'message.attachmentIndexedTime',
        label: 'Attachment indexed',
        valueType: 'date',
        esField: 'attachmentIndexedTime',
        queryType: 'term',
        allowedOperators: ['=', '!=', '>', '>=', '<', '<=']
    },

    {
        key: 'message.attachmentDownloaded',
        label: 'Attachment downloaded',
        valueType: 'boolean',
        esField: 'attachmentDownloaded',
        queryType: 'term',
        allowedOperators: ['=', '!=']
    },

    {
        key: 'message.attachmentParsed',
        label: 'Attachment parsed',
        valueType: 'boolean',
        esField: 'attachmentParsed',
        queryType: 'term',
        allowedOperators: ['=', '!=']
    },
    {
        key: 'message.indexedTime',
        label: 'Indexed time',
        description: 'When the message document was indexed (separate from message.createdTime).',
        valueType: 'date',
        esField: 'indexedTime',
        queryType: 'term',
        allowedOperators: ['=', '!=', '>', '>=', '<', '<=']
    },
    // ----- Virtual sender/recipient fields (resolved server-side via accounts) -----
    // Each message.from.* / message.to.* key runs a sub-query on accounts using the
    // underlying account.* attribute, then rewrites into `fromInternalID IN [...]` /
    // `toInternalID IN [...]` before the messages search executes. esField below is
    // the message-side join target after resolution.
    //
    // Group-conversation caveat: message.to.* filters return nothing in conversations
    // where conversationType=2, because toInternalID holds the group's id, not a
    // participant.

    {
        key: 'message.from.name',
        label: 'From — name',
        description: 'Sender name. Resolved via account.name → fromInternalID.',
        valueType: 'string',
        esField: 'fromInternalID',
        queryType: 'term',
        allowedOperators: ['=', '!=', ':', 'IN']
    },

    {
        key: 'message.to.name',
        label: 'To — name',
        description: 'Recipient name. Resolved via account.name → toInternalID. Group conversations not matched (v1).',
        valueType: 'string',
        esField: 'toInternalID',
        queryType: 'term',
        allowedOperators: ['=', '!=', ':', 'IN']
    },

    {
        key: 'message.from.userName',
        label: 'From — username',
        description: 'Sender username. Resolved via account.userName → fromInternalID.',
        valueType: 'string',
        esField: 'fromInternalID',
        queryType: 'term',
        allowedOperators: ['=', '!=', 'IN']
    },

    {
        key: 'message.to.userName',
        label: 'To — username',
        description: 'Recipient username. Resolved via account.userName → toInternalID.',
        valueType: 'string',
        esField: 'toInternalID',
        queryType: 'term',
        allowedOperators: ['=', '!=', 'IN']
    },

    {
        key: 'message.from.phoneNumber',
        label: 'From — phone',
        description: 'Sender phone. Resolved via account.phoneNumber → fromInternalID.',
        valueType: 'string',
        esField: 'fromInternalID',
        queryType: 'term',
        allowedOperators: ['=', '!=', 'IN']
    },

    {
        key: 'message.to.phoneNumber',
        label: 'To — phone',
        description: 'Recipient phone. Resolved via account.phoneNumber → toInternalID.',
        valueType: 'string',
        esField: 'toInternalID',
        queryType: 'term',
        allowedOperators: ['=', '!=', 'IN']
    },

    {
        key: 'message.from.alias',
        label: 'From — alias',
        description: 'Sender alias. Resolved via account.alias → fromInternalID.',
        valueType: 'string',
        esField: 'fromInternalID',
        queryType: 'term',
        allowedOperators: ['=', '!=', ':', 'IN']
    },

    {
        key: 'message.to.alias',
        label: 'To — alias',
        description: 'Recipient alias. Resolved via account.alias → toInternalID.',
        valueType: 'string',
        esField: 'toInternalID',
        queryType: 'term',
        allowedOperators: ['=', '!=', ':', 'IN']
    },

    {
        key: 'message.from.displayName',
        label: 'From — display name',
        description: 'Sender display name. Resolved via account.displayName → fromInternalID.',
        valueType: 'string',
        esField: 'fromInternalID',
        queryType: 'term',
        allowedOperators: ['=', '!=', ':', 'IN']
    },

    {
        key: 'message.to.displayName',
        label: 'To — display name',
        description: 'Recipient display name. Resolved via account.displayName → toInternalID.',
        valueType: 'string',
        esField: 'toInternalID',
        queryType: 'term',
        allowedOperators: ['=', '!=', ':', 'IN']
    },

    {
        key: 'message.from.categoryID',
        label: 'From — category ID',
        description: 'Sender category. Resolved via category.id → fromInternalID.',
        valueType: 'number',
        esField: 'fromInternalID',
        queryType: 'term',
        allowedOperators: ['=', '!=', 'IN']
    },

    {
        key: 'message.to.categoryID',
        label: 'To — category ID',
        description: 'Recipient category. Resolved via category.id → toInternalID.',
        valueType: 'number',
        esField: 'toInternalID',
        queryType: 'term',
        allowedOperators: ['=', '!=', 'IN']
    },

    {
        key: 'message.from.categoryName',
        label: 'From — category name',
        description: 'Sender category name. Resolved via category.name → fromInternalID.',
        valueType: 'string',
        esField: 'fromInternalID',
        queryType: 'term',
        allowedOperators: ['=', '!=', ':', 'IN']
    },

    {
        key: 'message.to.categoryName',
        label: 'To — category name',
        description: 'Recipient category name. Resolved via category.name → toInternalID.',
        valueType: 'string',
        esField: 'toInternalID',
        queryType: 'term',
        allowedOperators: ['=', '!=', ':', 'IN']
    },

    {
        key: 'message.from.birthday',
        label: 'From — birthday',
        description: 'Sender birthday. Resolved via account.birthday → fromInternalID.',
        valueType: 'date',
        esField: 'fromInternalID',
        queryType: 'term',
        allowedOperators: ['=', '!=', '>', '>=', '<', '<=']
    },

    {
        key: 'message.to.birthday',
        label: 'To — birthday',
        description: 'Recipient birthday. Resolved via account.birthday → toInternalID.',
        valueType: 'date',
        esField: 'toInternalID',
        queryType: 'term',
        allowedOperators: ['=', '!=', '>', '>=', '<', '<=']
    },
];


export const CONTACT_FIELDS: KeyConfig[] = [
    {
        key: 'contact.indexedTime',
        label: 'Indexed time',
        description: 'When this contact entry was indexed.',
        valueType: 'date',
        esField: 'indexedTime',
        queryType: 'term',
        allowedOperators: ['=', '!=', '>', '>=', '<', '<=']
    },

    {
        key: 'contact.accountInternalID',
        label: 'Account internal ID',
        description: 'Owning account (the contact list belongs to this account). Often passed as a query-string filter instead of a DSL term.',
        valueType: 'string',
        esField: 'accountInternalID',
        queryType: 'term',
        allowedOperators: ['=', '!=', 'IN']
    },

    {
        key: 'contact.internalID',
        label: 'Contact internal ID',
        valueType: 'string',
        esField: 'contactInternalID',
        queryType: 'term',
        allowedOperators: ['=', '!=', 'IN']
    },

    {
        key: 'contact.appID',
        label: 'App ID',
        valueType: 'number',
        esField: 'appID',
        queryType: 'term',
        allowedOperators: ['=', '!=', 'IN']
    },

    {
        key: 'contact.accountOrigID',
        label: 'Account origin ID',
        valueType: 'string',
        esField: 'accountOrigID',
        queryType: 'term',
        allowedOperators: ['=', '!=', 'IN']
    },

    {
        key: 'contact.sequence',
        label: 'Sequence',
        valueType: 'number',
        esField: 'sequence',
        queryType: 'term',
        allowedOperators: ['=', '!=', '>', '>=', '<', '<=', 'IN']
    },

    {
        key: 'contact.origID',
        label: 'Contact origin ID',
        valueType: 'string',
        esField: 'contactOrigID',
        queryType: 'term',
        allowedOperators: ['=', '!=', 'IN']
    },

    {
        key: 'contact.name',
        label: 'Contact name',
        description: 'Name as stored in the address book. Use ":" for diacritic-folded match.',
        valueType: 'string',
        esField: 'contactName',
        queryType: 'match',
        allowedOperators: ['=', '!=', ':', 'IN']
    },

    {
        key: 'contact.name.keyword',
        label: 'Contact name (exact / wildcard)',
        valueType: 'string',
        esField: 'contactName.keyword',
        queryType: 'wildcard',
        allowedOperators: ['=']
    },

    {
        key: 'contact.createdTime',
        label: 'Contact created time',
        valueType: 'date',
        esField: 'contactCreatedTime',
        queryType: 'term',
        allowedOperators: ['=', '!=', '>', '>=', '<', '<=']
    },

    {
        key: 'contact.id',
        label: 'Contact ID',
        valueType: 'number',
        esField: 'contactID',
        queryType: 'term',
        allowedOperators: ['=', '!=', 'IN']
    },

    {
        key: 'contact.userName',
        label: 'Contact username',
        valueType: 'string',
        esField: 'contactUserName',
        queryType: 'term',
        allowedOperators: ['=', '!=', 'IN']
    },

    {
        key: 'contact.alias',
        label: 'Contact alias',
        description: 'Alias the owner has assigned to this contact.',
        valueType: 'string',
        esField: 'contactAlias',
        queryType: 'match',
        allowedOperators: ['=', '!=', ':', 'IN']
    },

    {
        key: 'contact.alias.keyword',
        label: 'Contact alias (exact / wildcard)',
        valueType: 'string',
        esField: 'contactAlias.keyword',
        queryType: 'wildcard',
        allowedOperators: ['=']
    },

    {
        key: 'contact.birthday',
        label: 'Contact birthday',
        valueType: 'date',
        esField: 'contactBirthday',
        queryType: 'term',
        allowedOperators: ['=', '!=', '>', '>=', '<', '<=']
    },

    {
        key: 'contact.phoneNumber',
        label: 'Contact phone',
        description: 'Normalized phone number. Use ":" for diacritic-folded match (rarely useful for phones, mostly for symmetry).',
        valueType: 'string',
        esField: 'contactPhoneNumber',
        queryType: 'match',
        allowedOperators: ['=', '!=', ':', 'IN']
    },

    {
        key: 'contact.phoneNumber.keyword',
        label: 'Contact phone (exact / wildcard)',
        description: 'Exact / wildcard match against contactPhoneNumber.keyword.',
        valueType: 'string',
        esField: 'contactPhoneNumber.keyword',
        queryType: 'wildcard',
        allowedOperators: ['=']
    },

    {
        key: 'contact.phoneNumberRaw',
        label: 'Contact phone (raw)',
        description: 'Original phone string before normalization.',
        valueType: 'string',
        esField: 'contactPhoneNumberRaw',
        queryType: 'match',
        allowedOperators: ['=', '!=', ':', 'IN']
    },

    {
        key: 'contact.phoneNumberRaw.keyword',
        label: 'Contact phone (raw, exact / wildcard)',
        valueType: 'string',
        esField: 'contactPhoneNumberRaw.keyword',
        queryType: 'wildcard',
        allowedOperators: ['=']
    },
];


export const CALLOG_FIELDS: KeyConfig[] = [
    // ----- Direct callog fields -----

    {
        key: 'callog.appID',
        label: 'App ID',
        valueType: 'number',
        esField: 'appID',
        queryType: 'term',
        allowedOperators: ['=', '!=', 'IN']
    },

    {
        key: 'callog.durationMilliseconds',
        label: 'Duration (ms)',
        description: 'Call duration in milliseconds.',
        valueType: 'number',
        esField: 'durationMilliseconds',
        queryType: 'term',
        allowedOperators: ['=', '!=', '>', '>=', '<', '<=', 'IN']
    },

    {
        key: 'callog.contentType',
        label: 'Content type',
        valueType: 'number',
        esField: 'contentType',
        queryType: 'term',
        allowedOperators: ['=', '!=', 'IN']
    },

    {
        key: 'callog.conversationID',
        label: 'Conversation ID',
        valueType: 'string',
        esField: 'conversationID',
        queryType: 'term',
        allowedOperators: ['=', '!=', 'IN']
    },

    {
        key: 'callog.disabled',
        label: 'Disabled',
        description: 'Default filter excludes disabled callogs; query explicitly to include them.',
        valueType: 'boolean',
        esField: 'disabled',
        queryType: 'term',
        allowedOperators: ['=', '!=']
    },

    {
        key: 'callog.type',
        label: 'Call type',
        description: 'Numeric call-type code (incoming, outgoing, missed, etc. — values are app-defined).',
        valueType: 'number',
        esField: 'type',
        queryType: 'term',
        allowedOperators: ['=', '!=', 'IN']
    },

    {
        key: 'callog.fromOrigID',
        label: 'From (origID)',
        valueType: 'string',
        esField: 'fromOrigID',
        queryType: 'term',
        allowedOperators: ['=', '!=', 'IN']
    },

    {
        key: 'callog.toOrigID',
        label: 'To (origID)',
        valueType: 'string',
        esField: 'toOrigID',
        queryType: 'term',
        allowedOperators: ['=', '!=', 'IN']
    },

    {
        key: 'callog.fromInternalID',
        label: 'From (internalID)',
        description: 'Caller account internalID; same key space as accounts.internalID.',
        valueType: 'string',
        esField: 'fromInternalID',
        queryType: 'term',
        allowedOperators: ['=', '!=', 'IN']
    },

    {
        key: 'callog.toInternalID',
        label: 'To (internalID)',
        description: 'Callee account internalID.',
        valueType: 'string',
        esField: 'toInternalID',
        queryType: 'term',
        allowedOperators: ['=', '!=', 'IN']
    },

    {
        key: 'callog.createdAt',
        label: 'Created at',
        description: 'When the call started.',
        valueType: 'date',
        esField: 'createdAt',
        queryType: 'term',
        allowedOperators: ['=', '!=', '>', '>=', '<', '<=']
    },

    {
        key: 'callog.updatedAt',
        label: 'Updated at',
        valueType: 'date',
        esField: 'updatedAt',
        queryType: 'term',
        allowedOperators: ['=', '!=', '>', '>=', '<', '<=']
    },

    // ----- Virtual caller / callee fields (resolved via accounts) -----
    // Same shape as message virtual fields: each runs a sub-query on accounts using
    // the underlying attribute, then rewrites into `fromInternalID IN [...]` /
    // `toInternalID IN [...]` before the callog search executes. esField below is
    // the post-resolution join target on the callogs index.

    {
        key: 'callog.from.name',
        label: 'Caller — name',
        description: 'Caller name. Resolved via accounts.name → fromInternalID.',
        valueType: 'string',
        esField: 'fromInternalID',
        queryType: 'term',
        allowedOperators: ['=', '!=', ':', 'IN']
    },

    {
        key: 'callog.to.name',
        label: 'Callee — name',
        description: 'Callee name. Resolved via accounts.name → toInternalID.',
        valueType: 'string',
        esField: 'toInternalID',
        queryType: 'term',
        allowedOperators: ['=', '!=', ':', 'IN']
    },

    {
        key: 'callog.from.userName',
        label: 'Caller — username',
        valueType: 'string',
        esField: 'fromInternalID',
        queryType: 'term',
        allowedOperators: ['=', '!=', 'IN']
    },

    {
        key: 'callog.to.userName',
        label: 'Callee — username',
        valueType: 'string',
        esField: 'toInternalID',
        queryType: 'term',
        allowedOperators: ['=', '!=', 'IN']
    },

    {
        key: 'callog.from.phoneNumber',
        label: 'Caller — phone',
        valueType: 'string',
        esField: 'fromInternalID',
        queryType: 'term',
        allowedOperators: ['=', '!=', 'IN']
    },

    {
        key: 'callog.to.phoneNumber',
        label: 'Callee — phone',
        valueType: 'string',
        esField: 'toInternalID',
        queryType: 'term',
        allowedOperators: ['=', '!=', 'IN']
    },

    {
        key: 'callog.from.alias',
        label: 'Caller — alias',
        valueType: 'string',
        esField: 'fromInternalID',
        queryType: 'term',
        allowedOperators: ['=', '!=', ':', 'IN']
    },

    {
        key: 'callog.to.alias',
        label: 'Callee — alias',
        valueType: 'string',
        esField: 'toInternalID',
        queryType: 'term',
        allowedOperators: ['=', '!=', ':', 'IN']
    },

    {
        key: 'callog.from.displayName',
        label: 'Caller — display name',
        valueType: 'string',
        esField: 'fromInternalID',
        queryType: 'term',
        allowedOperators: ['=', '!=', ':', 'IN']
    },

    {
        key: 'callog.to.displayName',
        label: 'Callee — display name',
        valueType: 'string',
        esField: 'toInternalID',
        queryType: 'term',
        allowedOperators: ['=', '!=', ':', 'IN']
    },

    {
        key: 'callog.from.categoryID',
        label: 'Caller — category ID',
        valueType: 'number',
        esField: 'fromInternalID',
        queryType: 'term',
        allowedOperators: ['=', '!=', 'IN']
    },

    {
        key: 'callog.to.categoryID',
        label: 'Callee — category ID',
        valueType: 'number',
        esField: 'toInternalID',
        queryType: 'term',
        allowedOperators: ['=', '!=', 'IN']
    },

    {
        key: 'callog.from.categoryName',
        label: 'Caller — category name',
        valueType: 'string',
        esField: 'fromInternalID',
        queryType: 'term',
        allowedOperators: ['=', '!=', ':', 'IN']
    },

    {
        key: 'callog.to.categoryName',
        label: 'Callee — category name',
        valueType: 'string',
        esField: 'toInternalID',
        queryType: 'term',
        allowedOperators: ['=', '!=', ':', 'IN']
    },

    {
        key: 'callog.from.birthday',
        label: 'Caller — birthday',
        valueType: 'date',
        esField: 'fromInternalID',
        queryType: 'term',
        allowedOperators: ['=', '!=', '>', '>=', '<', '<=']
    },

    {
        key: 'callog.to.birthday',
        label: 'Callee — birthday',
        valueType: 'date',
        esField: 'toInternalID',
        queryType: 'term',
        allowedOperators: ['=', '!=', '>', '>=', '<', '<=']
    },
    {
        key: 'callog.indexedTime',
        label: 'Indexed time',
        description: 'When the callog document was indexed (separate from callog.createdAt).',
        valueType: 'date',
        esField: 'indexedTime',
        queryType: 'term',
        allowedOperators: ['=', '!=', '>', '>=', '<', '<=']
    },
];

const messageKey = MESSAGE_FIELDS.map(x => x.key);
const contactKey = CONTACT_FIELDS.map(x => x.key);
const callogs = CALLOG_FIELDS.map(x => x.key);

export const realKeyConfigs = [
    ...ACCOUNT_FIELDS,
    ...CONVERSATION_FIELDS,
    ...MESSAGE_FIELDS.map(x => {

        return {
            ...x,
            disabledWhenKeysPresent: [...contactKey, ...callogs]
        }
    }),
    ...CONTACT_FIELDS.map(x => {

        return {
            ...x,
            disabledWhenKeysPresent: [...messageKey, ...callogs]
        }
    }),
    ...CALLOG_FIELDS.map(x => {

        return {
            ...x,
            disabledWhenKeysPresent: [...messageKey, ...contactKey]
        }
    }),
]