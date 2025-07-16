"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  DeliveryStatus: () => DeliveryStatus,
  DeliveryTrackingService: () => DeliveryTrackingService,
  EmailRecipientSchema: () => EmailRecipientSchema,
  EmailService: () => EmailService,
  NotificationContentSchema: () => NotificationContentSchema,
  NotificationHistory: () => NotificationHistory,
  NotificationPreferencesComponent: () => NotificationPreferences2,
  NotificationPriority: () => NotificationPriority,
  NotificationRequestSchema: () => NotificationRequestSchema,
  NotificationService: () => NotificationService,
  NotificationType: () => NotificationType,
  QueueService: () => QueueService,
  SMSRecipientSchema: () => SMSRecipientSchema,
  SMSService: () => SMSService,
  TemplateEditor: () => TemplateEditor,
  TemplateEngine: () => TemplateEngine,
  TemplateSchema: () => TemplateSchema,
  TemplateVariablesSchema: () => TemplateVariablesSchema,
  TestSender: () => TestSender,
  createNotificationService: () => createNotificationService,
  default: () => index_default,
  extractTemplateVariables: () => extractTemplateVariables,
  formatPhoneNumber: () => formatPhoneNumber,
  generateSampleData: () => generateSampleData,
  getTemplateCharacterCount: () => getTemplateCharacterCount,
  sanitizeInput: () => sanitizeInput,
  sanitizeTemplateContent: () => sanitizeTemplateContent,
  useNotification: () => useNotification,
  useNotificationPreferences: () => useNotificationPreferences,
  validateAttachment: () => validateAttachment,
  validateBulkNotifications: () => validateBulkNotifications,
  validateEmail: () => validateEmail,
  validateKoreanPhoneNumber: () => validateKoreanPhoneNumber,
  validateNotificationRequest: () => validateNotificationRequest,
  validateTemplate: () => validateTemplate,
  validateTemplateForType: () => validateTemplateForType,
  validateTemplateSyntax: () => validateTemplateSyntax
});
module.exports = __toCommonJS(index_exports);

// src/types/index.ts
var import_zod = require("zod");
var NotificationType = /* @__PURE__ */ ((NotificationType3) => {
  NotificationType3["EMAIL"] = "email";
  NotificationType3["SMS"] = "sms";
  NotificationType3["PUSH"] = "push";
  NotificationType3["IN_APP"] = "in_app";
  return NotificationType3;
})(NotificationType || {});
var NotificationPriority = /* @__PURE__ */ ((NotificationPriority3) => {
  NotificationPriority3["LOW"] = "low";
  NotificationPriority3["NORMAL"] = "normal";
  NotificationPriority3["HIGH"] = "high";
  NotificationPriority3["URGENT"] = "urgent";
  return NotificationPriority3;
})(NotificationPriority || {});
var DeliveryStatus = /* @__PURE__ */ ((DeliveryStatus3) => {
  DeliveryStatus3["PENDING"] = "pending";
  DeliveryStatus3["QUEUED"] = "queued";
  DeliveryStatus3["SENDING"] = "sending";
  DeliveryStatus3["SENT"] = "sent";
  DeliveryStatus3["DELIVERED"] = "delivered";
  DeliveryStatus3["FAILED"] = "failed";
  DeliveryStatus3["BOUNCED"] = "bounced";
  return DeliveryStatus3;
})(DeliveryStatus || {});
var NotificationRequestSchema = import_zod.z.object({
  type: import_zod.z.nativeEnum(NotificationType),
  recipient: import_zod.z.object({
    email: import_zod.z.string().email().optional(),
    phone: import_zod.z.string().optional(),
    userId: import_zod.z.string().optional(),
    deviceToken: import_zod.z.string().optional(),
    locale: import_zod.z.string().optional()
  }),
  templateId: import_zod.z.string().optional(),
  content: import_zod.z.object({
    subject: import_zod.z.string().optional(),
    body: import_zod.z.string(),
    html: import_zod.z.string().optional()
  }).optional(),
  variables: import_zod.z.record(import_zod.z.any()).optional(),
  priority: import_zod.z.nativeEnum(NotificationPriority).optional(),
  scheduledAt: import_zod.z.date().optional(),
  metadata: import_zod.z.record(import_zod.z.any()).optional()
});
var TemplateSchema = import_zod.z.object({
  name: import_zod.z.string().min(1),
  type: import_zod.z.nativeEnum(NotificationType),
  subject: import_zod.z.string().optional(),
  content: import_zod.z.string().min(1),
  language: import_zod.z.string().default("ko"),
  variables: import_zod.z.array(import_zod.z.string()).default([])
});

// src/services/EmailService.ts
var import_client_ses = require("@aws-sdk/client-ses");
var import_mail = __toESM(require("@sendgrid/mail"));
var EmailService = class {
  sesClient;
  config;
  constructor(config) {
    this.config = config;
    this.initializeProvider();
  }
  initializeProvider() {
    switch (this.config.provider.type) {
      case "ses":
        this.sesClient = new import_client_ses.SESClient(this.config.provider.config);
        break;
      case "sendgrid":
        if (this.config.provider.config.apiKey) {
          import_mail.default.setApiKey(this.config.provider.config.apiKey);
        }
        break;
      case "smtp":
        break;
    }
  }
  async send(recipient, content, options) {
    if (!recipient.email) {
      throw new Error("Email recipient is required");
    }
    try {
      switch (this.config.provider.type) {
        case "ses":
          return await this.sendWithSES(recipient.email, content, options);
        case "sendgrid":
          return await this.sendWithSendGrid(recipient.email, content, options);
        default:
          throw new Error(`Unsupported email provider: ${this.config.provider.type}`);
      }
    } catch (error) {
      return {
        status: "failed" /* FAILED */,
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  }
  async sendWithSES(to, content, options) {
    if (!this.sesClient) {
      throw new Error("SES client not initialized");
    }
    const params = {
      Source: options?.from || this.config.defaultFrom,
      Destination: {
        ToAddresses: [to],
        CcAddresses: options?.cc,
        BccAddresses: options?.bcc
      },
      Message: {
        Subject: {
          Data: content.subject || "No Subject",
          Charset: "UTF-8"
        },
        Body: {
          Text: {
            Data: content.body,
            Charset: "UTF-8"
          },
          Html: content.html ? {
            Data: content.html,
            Charset: "UTF-8"
          } : void 0
        }
      },
      ReplyToAddresses: options?.replyTo ? [options.replyTo] : void 0,
      Tags: options?.tags?.map((tag) => ({ Name: tag, Value: "true" }))
    };
    try {
      const command = new import_client_ses.SendEmailCommand(params);
      const response = await this.sesClient.send(command);
      return {
        status: "sent" /* SENT */,
        messageId: response.MessageId
      };
    } catch (error) {
      throw error;
    }
  }
  async sendWithSendGrid(to, content, options) {
    const msg = {
      to,
      from: options?.from || this.config.defaultFrom,
      subject: content.subject || "No Subject",
      text: content.body,
      html: content.html,
      cc: options?.cc,
      bcc: options?.bcc,
      replyTo: options?.replyTo,
      categories: options?.tags,
      attachments: content.attachments?.map((att) => ({
        content: typeof att.content === "string" ? att.content : att.content.toString("base64"),
        filename: att.filename,
        type: att.contentType,
        disposition: "attachment"
      }))
    };
    try {
      const [response] = await import_mail.default.send(msg);
      return {
        status: "sent" /* SENT */,
        messageId: response.headers["x-message-id"]
      };
    } catch (error) {
      throw error;
    }
  }
  async sendBulk(recipients, content, options) {
    const results = /* @__PURE__ */ new Map();
    if (this.config.provider.type === "sendgrid") {
      return this.sendBulkWithSendGrid(recipients, content, options);
    }
    for (const recipient of recipients) {
      if (recipient.email) {
        const result = await this.send(recipient, content, options);
        results.set(recipient.email, result);
      }
    }
    return results;
  }
  async sendBulkWithSendGrid(recipients, content, options) {
    const results = /* @__PURE__ */ new Map();
    const emails = recipients.filter((r) => r.email).map((r) => r.email);
    const msg = {
      to: emails,
      from: options?.from || this.config.defaultFrom,
      subject: content.subject || "No Subject",
      text: content.body,
      html: content.html,
      isMultiple: true
    };
    try {
      await import_mail.default.sendMultiple(msg);
      emails.forEach((email) => {
        results.set(email, { status: "sent" /* SENT */ });
      });
    } catch (error) {
      emails.forEach((email) => {
        results.set(email, {
          status: "failed" /* FAILED */,
          error: error instanceof Error ? error.message : "Unknown error"
        });
      });
    }
    return results;
  }
  validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
};

// src/services/SMSService.ts
var import_axios = __toESM(require("axios"));
var SMSService = class {
  config;
  httpClient;
  constructor(config) {
    this.config = config;
    this.httpClient = import_axios.default.create({
      timeout: 3e4,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      }
    });
  }
  async send(recipient, message, options) {
    if (!recipient.phone) {
      throw new Error("Phone number is required for SMS");
    }
    const phoneNumber = this.normalizePhoneNumber(recipient.phone);
    if (!this.validatePhoneNumber(phoneNumber)) {
      return {
        status: "failed" /* FAILED */,
        error: "Invalid phone number format"
      };
    }
    try {
      switch (this.config.provider.type) {
        case "aligo":
          return await this.sendWithAligo(phoneNumber, message, options);
        case "solutionbox":
          return await this.sendWithSolutionBox(phoneNumber, message, options);
        default:
          throw new Error(`Unsupported SMS provider: ${this.config.provider.type}`);
      }
    } catch (error) {
      return {
        status: "failed" /* FAILED */,
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  }
  async sendWithAligo(phoneNumber, message, options) {
    const { apiKey, userId, apiUrl = "https://apis.aligo.in/send/" } = this.config.provider.config;
    if (!apiKey || !userId) {
      throw new Error("Aligo API key and user ID are required");
    }
    const messageType = this.determineMessageType(message);
    const params = new URLSearchParams({
      key: apiKey,
      user_id: userId,
      sender: options?.sender || this.config.defaultSender,
      receiver: phoneNumber,
      msg: message,
      msg_type: messageType,
      testmode_yn: this.config.testMode ? "Y" : "N"
    });
    if (messageType === "LMS" && options?.title) {
      params.append("title", options.title);
    }
    try {
      const response = await this.httpClient.post(
        apiUrl,
        params.toString()
      );
      const result = response.data;
      if (result.result_code === "1") {
        return {
          status: "sent" /* SENT */,
          messageId: result.msg_id
        };
      } else {
        return {
          status: "failed" /* FAILED */,
          error: result.message
        };
      }
    } catch (error) {
      throw error;
    }
  }
  async sendWithSolutionBox(phoneNumber, message, options) {
    const { apiKey, apiUrl = "https://api.solutionbox.co.kr/api/v1/sms/send" } = this.config.provider.config;
    if (!apiKey) {
      throw new Error("SolutionBox API key is required");
    }
    const messageType = this.determineMessageType(message);
    const requestBody = {
      api_key: apiKey,
      sender: options?.sender || this.config.defaultSender,
      receiver: phoneNumber,
      message,
      msg_type: messageType,
      title: messageType === "LMS" ? options?.title : void 0,
      test_mode: this.config.testMode
    };
    try {
      const response = await this.httpClient.post(
        apiUrl,
        requestBody,
        {
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`
          }
        }
      );
      const result = response.data;
      if (result.code === "0000") {
        return {
          status: "sent" /* SENT */,
          messageId: result.messageId,
          remainingCredits: result.remainPoint
        };
      } else {
        return {
          status: "failed" /* FAILED */,
          error: result.message
        };
      }
    } catch (error) {
      throw error;
    }
  }
  async sendBulk(recipients, message, options) {
    const results = /* @__PURE__ */ new Map();
    const phoneNumbers = recipients.filter((r) => r.phone).map((r) => this.normalizePhoneNumber(r.phone)).filter((phone) => this.validatePhoneNumber(phone));
    if (phoneNumbers.length === 0) {
      return results;
    }
    if (this.config.provider.type === "aligo") {
      const receiverList = phoneNumbers.join(",");
      try {
        const result = await this.sendWithAligo(receiverList, message, options);
        phoneNumbers.forEach((phone) => {
          results.set(phone, result);
        });
      } catch (error) {
        phoneNumbers.forEach((phone) => {
          results.set(phone, {
            status: "failed" /* FAILED */,
            error: error instanceof Error ? error.message : "Unknown error"
          });
        });
      }
    } else {
      for (const recipient of recipients) {
        if (recipient.phone) {
          const result = await this.send(recipient, message, options);
          results.set(recipient.phone, result);
        }
      }
    }
    return results;
  }
  normalizePhoneNumber(phone) {
    let normalized = phone.replace(/\D/g, "");
    if (!normalized.startsWith("82") && normalized.startsWith("0")) {
      normalized = "82" + normalized.substring(1);
    }
    return normalized;
  }
  validatePhoneNumber(phone) {
    const koreanPhoneRegex = /^82[0-9]{9,10}$/;
    return koreanPhoneRegex.test(phone);
  }
  determineMessageType(message) {
    const byteLength = Buffer.from(message, "utf-8").length;
    if (byteLength <= 90) {
      return "SMS";
    } else if (byteLength <= 2e3) {
      return "LMS";
    } else {
      return "MMS";
    }
  }
  async checkBalance() {
    try {
      switch (this.config.provider.type) {
        case "aligo":
          return await this.checkAligoBalance();
        case "solutionbox":
          return await this.checkSolutionBoxBalance();
        default:
          return { error: "Balance check not supported for this provider" };
      }
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  }
  async checkAligoBalance() {
    const { apiKey, userId } = this.config.provider.config;
    const apiUrl = "https://apis.aligo.in/remain/";
    const params = new URLSearchParams({
      key: apiKey,
      user_id: userId
    });
    try {
      const response = await this.httpClient.post(apiUrl, params.toString());
      const result = response.data;
      if (result.result_code === "1") {
        return {
          balance: parseInt(result.SMS_CNT),
          unit: "messages"
        };
      } else {
        return { error: result.message };
      }
    } catch (error) {
      throw error;
    }
  }
  async checkSolutionBoxBalance() {
    const { apiKey } = this.config.provider.config;
    const apiUrl = "https://api.solutionbox.co.kr/api/v1/sms/balance";
    try {
      const response = await this.httpClient.get(apiUrl, {
        headers: {
          "Authorization": `Bearer ${apiKey}`
        }
      });
      const result = response.data;
      if (result.code === "0000") {
        return {
          balance: result.point,
          unit: "points"
        };
      } else {
        return { error: result.message };
      }
    } catch (error) {
      throw error;
    }
  }
};

// src/services/TemplateEngine.ts
var import_handlebars = __toESM(require("handlebars"));
var import_i18next = __toESM(require("i18next"));
var TemplateEngine = class {
  handlebars;
  templates;
  compiledTemplates;
  config;
  constructor(config = {}) {
    this.config = {
      defaultLanguage: "ko",
      ...config
    };
    this.handlebars = import_handlebars.default.create();
    this.templates = /* @__PURE__ */ new Map();
    this.compiledTemplates = /* @__PURE__ */ new Map();
    this.registerDefaultHelpers();
    this.registerCustomHelpers();
  }
  registerDefaultHelpers() {
    this.handlebars.registerHelper("dateFormat", (date, format) => {
      const dateObj = typeof date === "string" ? new Date(date) : date;
      if (!dateObj || isNaN(dateObj.getTime())) return "";
      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, "0");
      const day = String(dateObj.getDate()).padStart(2, "0");
      const hours = String(dateObj.getHours()).padStart(2, "0");
      const minutes = String(dateObj.getMinutes()).padStart(2, "0");
      return format.replace("YYYY", String(year)).replace("MM", month).replace("DD", day).replace("HH", hours).replace("mm", minutes);
    });
    this.handlebars.registerHelper("numberFormat", (num, locale = "ko-KR") => {
      if (typeof num !== "number") return "";
      return new Intl.NumberFormat(locale).format(num);
    });
    this.handlebars.registerHelper("currency", (amount, currency = "KRW", locale = "ko-KR") => {
      if (typeof amount !== "number") return "";
      return new Intl.NumberFormat(locale, {
        style: "currency",
        currency
      }).format(amount);
    });
    this.handlebars.registerHelper("eq", (a, b) => a === b);
    this.handlebars.registerHelper("ne", (a, b) => a !== b);
    this.handlebars.registerHelper("lt", (a, b) => a < b);
    this.handlebars.registerHelper("gt", (a, b) => a > b);
    this.handlebars.registerHelper("lte", (a, b) => a <= b);
    this.handlebars.registerHelper("gte", (a, b) => a >= b);
    this.handlebars.registerHelper("t", (key, options) => {
      const lang = options.hash.lang || this.config.defaultLanguage;
      return import_i18next.default.t(key, { lng: lang, ...options.hash });
    });
    this.handlebars.registerHelper("plural", (count, singular, plural) => {
      return count === 1 ? singular : plural;
    });
  }
  registerCustomHelpers() {
    if (this.config.customHelpers) {
      Object.entries(this.config.customHelpers).forEach(([name, helper]) => {
        this.handlebars.registerHelper(name, helper);
      });
    }
  }
  registerTemplate(template) {
    const languageMap = this.templates.get(template.id) || /* @__PURE__ */ new Map();
    languageMap.set(template.language, template);
    this.templates.set(template.id, languageMap);
    const cacheKey = `${template.id}_${template.language}`;
    const compiled = this.handlebars.compile(template.content);
    this.compiledTemplates.set(cacheKey, compiled);
    if (template.subject && template.type === "email" /* EMAIL */) {
      const subjectKey = `${cacheKey}_subject`;
      const compiledSubject = this.handlebars.compile(template.subject);
      this.compiledTemplates.set(subjectKey, compiledSubject);
    }
  }
  render(templateId, variables = {}, language) {
    const lang = language || this.config.defaultLanguage;
    const languageMap = this.templates.get(templateId);
    if (!languageMap) {
      throw new Error(`Template not found: ${templateId}`);
    }
    let template = languageMap.get(lang);
    if (!template && lang !== this.config.defaultLanguage) {
      template = languageMap.get(this.config.defaultLanguage);
    }
    if (!template) {
      throw new Error(`Template not found for language: ${lang}`);
    }
    this.validateVariables(template, variables);
    const cacheKey = `${templateId}_${template.language}`;
    const compiledContent = this.compiledTemplates.get(cacheKey);
    const compiledSubject = this.compiledTemplates.get(`${cacheKey}_subject`);
    if (!compiledContent) {
      throw new Error(`Template not compiled: ${templateId}`);
    }
    const context = {
      ...variables,
      _language: template.language,
      _timestamp: /* @__PURE__ */ new Date()
    };
    const result = {
      content: compiledContent(context)
    };
    if (compiledSubject) {
      result.subject = compiledSubject(context);
    }
    return result;
  }
  validateVariables(template, variables) {
    const missingVars = template.variables.filter(
      (varName) => !(varName in variables)
    );
    if (missingVars.length > 0) {
      throw new Error(
        `Missing required template variables: ${missingVars.join(", ")}`
      );
    }
  }
  renderRaw(content, variables = {}) {
    const compiled = this.handlebars.compile(content);
    return compiled(variables);
  }
  getTemplate(templateId, language) {
    const lang = language || this.config.defaultLanguage;
    const languageMap = this.templates.get(templateId);
    if (!languageMap) {
      return void 0;
    }
    return languageMap.get(lang) || languageMap.get(this.config.defaultLanguage);
  }
  listTemplates(type, language) {
    const result = [];
    this.templates.forEach((languageMap) => {
      languageMap.forEach((template) => {
        if ((!type || template.type === type) && (!language || template.language === language)) {
          result.push(template);
        }
      });
    });
    return result;
  }
  extractVariables(content) {
    const variablePattern = /\{\{[\s]*([a-zA-Z_$][a-zA-Z0-9_$\.]*)[\s]*\}\}/g;
    const variables = /* @__PURE__ */ new Set();
    let match;
    while ((match = variablePattern.exec(content)) !== null) {
      variables.add(match[1]);
    }
    return Array.from(variables);
  }
  validateTemplate(content) {
    try {
      this.handlebars.compile(content);
      const variables = this.extractVariables(content);
      return { valid: true, variables };
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : "Invalid template syntax"
      };
    }
  }
};

// src/services/QueueService.ts
var import_bull = __toESM(require("bull"));
var QueueService = class {
  queues;
  config;
  constructor(config) {
    this.config = config;
    this.queues = /* @__PURE__ */ new Map();
    this.initializeQueues();
  }
  initializeQueues() {
    Object.values(NotificationType).forEach((type) => {
      const queue = new import_bull.default(`notification-${type}`, {
        redis: this.config.redis,
        defaultJobOptions: {
          removeOnComplete: 100,
          removeOnFail: 50,
          attempts: 3,
          backoff: {
            type: "exponential",
            delay: 2e3
          },
          ...this.config.defaultJobOptions
        }
      });
      this.queues.set(type, queue);
    });
  }
  async addNotification(request, options) {
    const queue = this.queues.get(request.type);
    if (!queue) {
      throw new Error(`Queue not found for type: ${request.type}`);
    }
    const jobOptions = {
      delay: options?.delay || (request.scheduledAt ? new Date(request.scheduledAt).getTime() - Date.now() : 0),
      priority: options?.priority || this.getPriorityValue(request.priority),
      attempts: options?.attempts || 3
    };
    const job = await queue.add("send-notification", request, jobOptions);
    return job.id.toString();
  }
  async addBulkNotifications(requests, options) {
    const jobIds = [];
    const groupedRequests = /* @__PURE__ */ new Map();
    requests.forEach((request) => {
      const group = groupedRequests.get(request.type) || [];
      group.push(request);
      groupedRequests.set(request.type, group);
    });
    for (const [type, typeRequests] of groupedRequests) {
      const queue = this.queues.get(type);
      if (!queue) continue;
      const jobs = typeRequests.map((request) => ({
        name: "send-notification",
        data: request,
        opts: {
          ...options,
          priority: this.getPriorityValue(request.priority)
        }
      }));
      const addedJobs = await queue.addBulk(jobs);
      jobIds.push(...addedJobs.map((job) => job.id.toString()));
    }
    return jobIds;
  }
  async getJob(type, jobId) {
    const queue = this.queues.get(type);
    if (!queue) return null;
    const job = await queue.getJob(jobId);
    if (!job) return null;
    return this.mapJobToNotificationJob(job);
  }
  async getJobs(type, status, limit = 20) {
    const queue = this.queues.get(type);
    if (!queue) return [];
    let jobs = [];
    switch (status) {
      case "waiting":
        jobs = await queue.getWaiting(0, limit);
        break;
      case "active":
        jobs = await queue.getActive(0, limit);
        break;
      case "completed":
        jobs = await queue.getCompleted(0, limit);
        break;
      case "failed":
        jobs = await queue.getFailed(0, limit);
        break;
      case "delayed":
        jobs = await queue.getDelayed(0, limit);
        break;
      default:
        jobs = await queue.getJobs(["waiting", "active", "delayed"], 0, limit);
    }
    return jobs.map((job) => this.mapJobToNotificationJob(job));
  }
  async retryJob(type, jobId) {
    const queue = this.queues.get(type);
    if (!queue) throw new Error(`Queue not found for type: ${type}`);
    const job = await queue.getJob(jobId);
    if (!job) throw new Error(`Job not found: ${jobId}`);
    await job.retry();
  }
  async removeJob(type, jobId) {
    const queue = this.queues.get(type);
    if (!queue) throw new Error(`Queue not found for type: ${type}`);
    const job = await queue.getJob(jobId);
    if (!job) throw new Error(`Job not found: ${jobId}`);
    await job.remove();
  }
  async pauseQueue(type) {
    const queue = this.queues.get(type);
    if (!queue) throw new Error(`Queue not found for type: ${type}`);
    await queue.pause();
  }
  async resumeQueue(type) {
    const queue = this.queues.get(type);
    if (!queue) throw new Error(`Queue not found for type: ${type}`);
    await queue.resume();
  }
  async getQueueStatus(type) {
    const queue = this.queues.get(type);
    if (!queue) throw new Error(`Queue not found for type: ${type}`);
    const [waiting, active, completed, failed, delayed, paused] = await Promise.all([
      queue.getWaitingCount(),
      queue.getActiveCount(),
      queue.getCompletedCount(),
      queue.getFailedCount(),
      queue.getDelayedCount(),
      queue.isPaused()
    ]);
    return { waiting, active, completed, failed, delayed, paused };
  }
  async cleanQueue(type, grace = 36e5, status = "completed") {
    const queue = this.queues.get(type);
    if (!queue) throw new Error(`Queue not found for type: ${type}`);
    await queue.clean(grace, status);
  }
  registerProcessor(type, processor) {
    const queue = this.queues.get(type);
    if (!queue) throw new Error(`Queue not found for type: ${type}`);
    queue.process(
      "send-notification",
      this.config.maxConcurrency || 5,
      processor
    );
  }
  onJobComplete(type, callback) {
    const queue = this.queues.get(type);
    if (!queue) return;
    queue.on("completed", callback);
  }
  onJobFailed(type, callback) {
    const queue = this.queues.get(type);
    if (!queue) return;
    queue.on("failed", callback);
  }
  getPriorityValue(priority) {
    switch (priority) {
      case "urgent" /* URGENT */:
        return 1;
      case "high" /* HIGH */:
        return 2;
      case "normal" /* NORMAL */:
        return 3;
      case "low" /* LOW */:
        return 4;
      default:
        return 3;
    }
  }
  mapJobToNotificationJob(job) {
    return {
      id: job.id.toString(),
      type: job.data.type,
      payload: job.data,
      attempts: job.attemptsMade,
      maxAttempts: job.opts.attempts || 3,
      nextAttempt: job.processedOn ? new Date(job.processedOn + (job.opts.backoff?.delay || 2e3)) : void 0,
      priority: job.opts.priority || 3,
      createdAt: new Date(job.timestamp)
    };
  }
  async close() {
    await Promise.all(
      Array.from(this.queues.values()).map((queue) => queue.close())
    );
  }
};

// src/services/DeliveryTrackingService.ts
var DeliveryTrackingService = class {
  deliveries;
  config;
  webhookHandlers;
  constructor(config = {}) {
    this.config = {
      retentionDays: 30,
      enableWebhooks: true,
      ...config
    };
    this.deliveries = /* @__PURE__ */ new Map();
    this.webhookHandlers = /* @__PURE__ */ new Map();
  }
  async createDelivery(notificationId, type, recipient, provider) {
    const delivery = {
      id: this.generateDeliveryId(),
      notificationId,
      type,
      recipient,
      status: "pending" /* PENDING */,
      provider,
      attempts: 0,
      metadata: {}
    };
    this.deliveries.set(delivery.id, delivery);
    await this.triggerWebhook("created", delivery);
    return delivery;
  }
  async updateDeliveryStatus(deliveryId, status, details) {
    const delivery = this.deliveries.get(deliveryId);
    if (!delivery) return null;
    delivery.status = status;
    if (details) {
      if (details.providerResponse) {
        delivery.providerResponse = details.providerResponse;
      }
      if (details.error) {
        delivery.error = details.error;
      }
      if (details.metadata) {
        delivery.metadata = { ...delivery.metadata, ...details.metadata };
      }
    }
    switch (status) {
      case "sent" /* SENT */:
        delivery.sentAt = /* @__PURE__ */ new Date();
        break;
      case "delivered" /* DELIVERED */:
        delivery.deliveredAt = /* @__PURE__ */ new Date();
        break;
      case "failed" /* FAILED */:
      case "bounced" /* BOUNCED */:
        delivery.failedAt = /* @__PURE__ */ new Date();
        break;
    }
    this.deliveries.set(deliveryId, delivery);
    await this.triggerWebhook("updated", delivery);
    return delivery;
  }
  async incrementAttempts(deliveryId) {
    const delivery = this.deliveries.get(deliveryId);
    if (delivery) {
      delivery.attempts += 1;
      this.deliveries.set(deliveryId, delivery);
    }
  }
  getDelivery(deliveryId) {
    return this.deliveries.get(deliveryId) || null;
  }
  getDeliveriesByNotification(notificationId) {
    return Array.from(this.deliveries.values()).filter(
      (delivery) => delivery.notificationId === notificationId
    );
  }
  getDeliveriesByRecipient(recipient, type) {
    return Array.from(this.deliveries.values()).filter(
      (delivery) => delivery.recipient === recipient && (!type || delivery.type === type)
    );
  }
  getDeliveriesByStatus(status, type) {
    return Array.from(this.deliveries.values()).filter(
      (delivery) => delivery.status === status && (!type || delivery.type === type)
    );
  }
  async getDeliveryStats(startDate, endDate, type) {
    const deliveries = Array.from(this.deliveries.values()).filter((delivery) => {
      const createdAt = delivery.sentAt || /* @__PURE__ */ new Date();
      return createdAt >= startDate && createdAt <= endDate && (!type || delivery.type === type);
    });
    const stats = {
      total: deliveries.length,
      sent: 0,
      delivered: 0,
      failed: 0,
      bounced: 0,
      deliveryRate: 0,
      byProvider: {}
    };
    deliveries.forEach((delivery) => {
      switch (delivery.status) {
        case "sent" /* SENT */:
          stats.sent++;
          break;
        case "delivered" /* DELIVERED */:
          stats.delivered++;
          break;
        case "failed" /* FAILED */:
          stats.failed++;
          break;
        case "bounced" /* BOUNCED */:
          stats.bounced++;
          break;
      }
      if (!stats.byProvider[delivery.provider]) {
        stats.byProvider[delivery.provider] = {
          total: 0,
          delivered: 0,
          failed: 0
        };
      }
      stats.byProvider[delivery.provider].total++;
      if (delivery.status === "delivered" /* DELIVERED */) {
        stats.byProvider[delivery.provider].delivered++;
      } else if (delivery.status === "failed" /* FAILED */ || delivery.status === "bounced" /* BOUNCED */) {
        stats.byProvider[delivery.provider].failed++;
      }
    });
    stats.deliveryRate = stats.total > 0 ? stats.delivered / stats.total * 100 : 0;
    return stats;
  }
  registerWebhook(event, handler) {
    if (this.config.enableWebhooks) {
      this.webhookHandlers.set(event, handler);
    }
  }
  async triggerWebhook(event, delivery) {
    if (!this.config.enableWebhooks) return;
    const handler = this.webhookHandlers.get(event);
    if (handler) {
      try {
        await handler(delivery);
      } catch (error) {
        console.error(`Webhook error for ${event}:`, error);
      }
    }
  }
  async cleanupOldDeliveries() {
    const cutoffDate = /* @__PURE__ */ new Date();
    cutoffDate.setDate(cutoffDate.getDate() - (this.config.retentionDays || 30));
    let deletedCount = 0;
    for (const [id, delivery] of this.deliveries) {
      const deliveryDate = delivery.deliveredAt || delivery.failedAt || delivery.sentAt;
      if (deliveryDate && deliveryDate < cutoffDate) {
        this.deliveries.delete(id);
        deletedCount++;
      }
    }
    return deletedCount;
  }
  exportDeliveries(filter) {
    let deliveries = Array.from(this.deliveries.values());
    if (filter) {
      if (filter.startDate || filter.endDate) {
        deliveries = deliveries.filter((delivery) => {
          const date = delivery.sentAt || /* @__PURE__ */ new Date();
          return (!filter.startDate || date >= filter.startDate) && (!filter.endDate || date <= filter.endDate);
        });
      }
      if (filter.type) {
        deliveries = deliveries.filter((d) => d.type === filter.type);
      }
      if (filter.status) {
        deliveries = deliveries.filter((d) => d.status === filter.status);
      }
    }
    return deliveries;
  }
  generateDeliveryId() {
    return `delivery_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
};

// src/services/NotificationService.ts
var NotificationService = class {
  emailService;
  smsService;
  templateEngine;
  queueService;
  deliveryTracking;
  userPreferences;
  constructor(config) {
    this.emailService = new EmailService(config.email);
    this.smsService = new SMSService(config.sms);
    this.templateEngine = new TemplateEngine(config.templates);
    this.queueService = new QueueService(config.queue);
    this.deliveryTracking = new DeliveryTrackingService();
    this.userPreferences = /* @__PURE__ */ new Map();
    this.setupQueueProcessors();
  }
  setupQueueProcessors() {
    this.queueService.registerProcessor(
      "email" /* EMAIL */,
      async (job) => {
        return this.processEmailNotification(job.data);
      }
    );
    this.queueService.registerProcessor(
      "sms" /* SMS */,
      async (job) => {
        return this.processSMSNotification(job.data);
      }
    );
    Object.values(NotificationType).forEach((type) => {
      this.queueService.onJobComplete(type, async (job, result) => {
        if (result.deliveryId) {
          await this.deliveryTracking.updateDeliveryStatus(
            result.deliveryId,
            "delivered" /* DELIVERED */,
            { providerResponse: result }
          );
        }
      });
      this.queueService.onJobFailed(type, async (job, error) => {
        if (job.data.metadata?.deliveryId) {
          await this.deliveryTracking.updateDeliveryStatus(
            job.data.metadata.deliveryId,
            "failed" /* FAILED */,
            { error: error.message }
          );
        }
      });
    });
  }
  async send(request) {
    try {
      const validation = NotificationRequestSchema.safeParse(request);
      if (!validation.success) {
        return {
          notificationId: "",
          queued: false,
          error: validation.error.message
        };
      }
      if (request.recipient.userId) {
        const canSend = await this.checkUserPreferences(
          request.recipient.userId,
          request.type,
          request.metadata?.category
        );
        if (!canSend) {
          return {
            notificationId: request.id || "",
            queued: false,
            error: "User has disabled this notification type"
          };
        }
      }
      const notificationId = request.id || this.generateNotificationId();
      request.id = notificationId;
      const recipient = this.getRecipientIdentifier(request);
      const delivery = await this.deliveryTracking.createDelivery(
        notificationId,
        request.type,
        recipient,
        this.getProviderName(request.type)
      );
      request.metadata = {
        ...request.metadata,
        deliveryId: delivery.id
      };
      if (request.priority === "urgent" && !request.scheduledAt) {
        return await this.sendImmediate(request, delivery);
      } else {
        const jobId = await this.queueService.addNotification(request);
        await this.deliveryTracking.updateDeliveryStatus(
          delivery.id,
          "queued" /* QUEUED */
        );
        return {
          notificationId,
          deliveryId: delivery.id,
          queued: true
        };
      }
    } catch (error) {
      return {
        notificationId: request.id || "",
        queued: false,
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  }
  async sendImmediate(request, delivery) {
    try {
      let result;
      switch (request.type) {
        case "email" /* EMAIL */:
          result = await this.processEmailNotification(request);
          break;
        case "sms" /* SMS */:
          result = await this.processSMSNotification(request);
          break;
        default:
          throw new Error(`Unsupported notification type: ${request.type}`);
      }
      if (result.success) {
        await this.deliveryTracking.updateDeliveryStatus(
          delivery.id,
          "delivered" /* DELIVERED */,
          { providerResponse: result }
        );
      } else {
        await this.deliveryTracking.updateDeliveryStatus(
          delivery.id,
          "failed" /* FAILED */,
          { error: result.error }
        );
      }
      return {
        notificationId: request.id,
        deliveryId: delivery.id,
        queued: false,
        error: result.error
      };
    } catch (error) {
      await this.deliveryTracking.updateDeliveryStatus(
        delivery.id,
        "failed" /* FAILED */,
        { error: error instanceof Error ? error.message : "Unknown error" }
      );
      return {
        notificationId: request.id,
        deliveryId: delivery.id,
        queued: false,
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  }
  async processEmailNotification(request) {
    let content = request.content;
    if (request.templateId) {
      const rendered = this.templateEngine.render(
        request.templateId,
        request.variables || {},
        request.recipient.locale
      );
      content = {
        subject: rendered.subject,
        body: rendered.content,
        html: rendered.content
      };
    }
    if (!content) {
      throw new Error("No content or template provided");
    }
    const result = await this.emailService.send(
      request.recipient,
      content,
      request.metadata
    );
    return {
      success: result.status === "sent" /* SENT */,
      messageId: result.messageId,
      error: result.error,
      deliveryId: request.metadata?.deliveryId
    };
  }
  async processSMSNotification(request) {
    let message = request.content?.body;
    if (request.templateId) {
      const rendered = this.templateEngine.render(
        request.templateId,
        request.variables || {},
        request.recipient.locale
      );
      message = rendered.content;
    }
    if (!message) {
      throw new Error("No message content or template provided");
    }
    const result = await this.smsService.send(
      request.recipient,
      message,
      request.metadata
    );
    return {
      success: result.status === "sent" /* SENT */,
      messageId: result.messageId,
      error: result.error,
      remainingCredits: result.remainingCredits,
      deliveryId: request.metadata?.deliveryId
    };
  }
  async sendBulk(requests) {
    const results = /* @__PURE__ */ new Map();
    for (const request of requests) {
      const result = await this.send(request);
      results.set(request.id || this.generateNotificationId(), result);
    }
    return results;
  }
  async updateUserPreferences(userId, preferences) {
    this.userPreferences.set(userId, preferences);
  }
  getUserPreferences(userId) {
    return this.userPreferences.get(userId);
  }
  async checkUserPreferences(userId, type, category) {
    const preferences = this.userPreferences.get(userId);
    if (!preferences) return true;
    const channelKey = type.toLowerCase();
    const channelPrefs = preferences.channels[channelKey];
    if (!channelPrefs?.enabled) return false;
    if (category && channelPrefs.categories) {
      return channelPrefs.categories[category] !== false;
    }
    if (preferences.quiet.enabled) {
      const now = /* @__PURE__ */ new Date();
      const currentTime = now.getHours() * 60 + now.getMinutes();
      const [startHour, startMin] = preferences.quiet.start.split(":").map(Number);
      const [endHour, endMin] = preferences.quiet.end.split(":").map(Number);
      const quietStart = startHour * 60 + startMin;
      const quietEnd = endHour * 60 + endMin;
      if (quietStart <= quietEnd) {
        if (currentTime >= quietStart && currentTime <= quietEnd) {
          return false;
        }
      } else {
        if (currentTime >= quietStart || currentTime <= quietEnd) {
          return false;
        }
      }
    }
    return true;
  }
  getRecipientIdentifier(request) {
    switch (request.type) {
      case "email" /* EMAIL */:
        return request.recipient.email || "unknown";
      case "sms" /* SMS */:
        return request.recipient.phone || "unknown";
      default:
        return request.recipient.userId || "unknown";
    }
  }
  getProviderName(type) {
    switch (type) {
      case "email" /* EMAIL */:
        return this.emailService["config"].provider.type;
      case "sms" /* SMS */:
        return this.smsService["config"].provider.type;
      default:
        return "unknown";
    }
  }
  generateNotificationId() {
    return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  // Template management
  registerTemplate(template) {
    this.templateEngine.registerTemplate(template);
  }
  // Queue management
  async getQueueStatus(type) {
    return this.queueService.getQueueStatus(type);
  }
  // Delivery tracking
  getDelivery(deliveryId) {
    return this.deliveryTracking.getDelivery(deliveryId);
  }
  async getDeliveryStats(startDate, endDate, type) {
    return this.deliveryTracking.getDeliveryStats(startDate, endDate, type);
  }
};

// src/components/NotificationPreferences.tsx
var import_react = require("react");
var import_jsx_runtime = require("react/jsx-runtime");
var NotificationPreferences2 = ({
  userId,
  preferences: initialPreferences,
  categories = [],
  onSave,
  className = ""
}) => {
  const [preferences, setPreferences] = (0, import_react.useState)(
    initialPreferences || {
      userId,
      channels: {
        email: { enabled: true, categories: {} },
        sms: { enabled: true, categories: {} },
        push: { enabled: true, categories: {} },
        inApp: { enabled: true, categories: {} }
      },
      quiet: {
        enabled: false,
        start: "22:00",
        end: "08:00",
        timezone: "Asia/Seoul"
      },
      locale: "ko",
      timezone: "Asia/Seoul"
    }
  );
  const [saving, setSaving] = (0, import_react.useState)(false);
  const [saved, setSaved] = (0, import_react.useState)(false);
  const handleChannelToggle = (channel) => {
    setPreferences((prev) => ({
      ...prev,
      channels: {
        ...prev.channels,
        [channel]: {
          ...prev.channels[channel],
          enabled: !prev.channels[channel].enabled
        }
      }
    }));
  };
  const handleCategoryToggle = (channel, categoryId) => {
    setPreferences((prev) => ({
      ...prev,
      channels: {
        ...prev.channels,
        [channel]: {
          ...prev.channels[channel],
          categories: {
            ...prev.channels[channel].categories,
            [categoryId]: !prev.channels[channel].categories[categoryId]
          }
        }
      }
    }));
  };
  const handleQuietHoursToggle = () => {
    setPreferences((prev) => ({
      ...prev,
      quiet: {
        ...prev.quiet,
        enabled: !prev.quiet.enabled
      }
    }));
  };
  const handleQuietHoursChange = (field, value) => {
    setPreferences((prev) => ({
      ...prev,
      quiet: {
        ...prev.quiet,
        [field]: value
      }
    }));
  };
  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      await onSave(preferences);
      setSaved(true);
      setTimeout(() => setSaved(false), 3e3);
    } catch (error) {
      console.error("Failed to save preferences:", error);
    } finally {
      setSaving(false);
    }
  };
  const channels = [
    { key: "email", label: "\uC774\uBA54\uC77C", icon: "\u2709\uFE0F" },
    { key: "sms", label: "SMS", icon: "\u{1F4AC}" },
    { key: "push", label: "\uD478\uC2DC \uC54C\uB9BC", icon: "\u{1F514}" },
    { key: "inApp", label: "\uC778\uC571 \uC54C\uB9BC", icon: "\u{1F4F1}" }
  ];
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: `notification-preferences ${className}`, children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "space-y-6", children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { className: "text-lg font-semibold mb-4", children: "\uC54C\uB9BC \uCC44\uB110 \uC124\uC815" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "space-y-4", children: channels.map((channel) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "border rounded-lg p-4", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "flex items-center justify-between mb-3", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "flex items-center space-x-3", children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "text-2xl", children: channel.icon }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "font-medium", children: channel.label })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { className: "relative inline-flex items-center cursor-pointer", children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
              "input",
              {
                type: "checkbox",
                className: "sr-only peer",
                checked: preferences.channels[channel.key].enabled,
                onChange: () => handleChannelToggle(channel.key)
              }
            ),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" })
          ] })
        ] }),
        preferences.channels[channel.key].enabled && categories.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "mt-3 pl-4 space-y-2", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: "text-sm text-gray-600 mb-2", children: "\uC54C\uB9BC \uCE74\uD14C\uACE0\uB9AC:" }),
          categories.map((category) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { className: "flex items-center space-x-2 cursor-pointer", children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
              "input",
              {
                type: "checkbox",
                className: "rounded text-blue-600 focus:ring-blue-500",
                checked: preferences.channels[channel.key].categories[category.id] !== false,
                onChange: () => handleCategoryToggle(channel.key, category.id)
              }
            ),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "text-sm", children: category.name }),
            category.description && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { className: "text-xs text-gray-500", children: [
              "(",
              category.description,
              ")"
            ] })
          ] }, category.id))
        ] })
      ] }, channel.key)) })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "border rounded-lg p-4", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "flex items-center justify-between mb-3", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { className: "font-medium", children: "\uBC29\uD574 \uAE08\uC9C0 \uC2DC\uAC04" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: "text-sm text-gray-600 mt-1", children: "\uC124\uC815\uB41C \uC2DC\uAC04\uC5D0\uB294 \uC54C\uB9BC\uC744 \uBC1B\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4" })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { className: "relative inline-flex items-center cursor-pointer", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            "input",
            {
              type: "checkbox",
              className: "sr-only peer",
              checked: preferences.quiet.enabled,
              onChange: handleQuietHoursToggle
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" })
        ] })
      ] }),
      preferences.quiet.enabled && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "flex items-center space-x-4 mt-4", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "flex-1", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "\uC2DC\uC791 \uC2DC\uAC04" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            "input",
            {
              type: "time",
              className: "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500",
              value: preferences.quiet.start,
              onChange: (e) => handleQuietHoursChange("start", e.target.value)
            }
          )
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "flex-1", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "\uC885\uB8CC \uC2DC\uAC04" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            "input",
            {
              type: "time",
              className: "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500",
              value: preferences.quiet.end,
              onChange: (e) => handleQuietHoursChange("end", e.target.value)
            }
          )
        ] })
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "flex justify-end space-x-3", children: [
      saved && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "text-green-600 flex items-center", children: "\u2713 \uC800\uC7A5\uB418\uC5C8\uC2B5\uB2C8\uB2E4" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        "button",
        {
          onClick: handleSave,
          disabled: saving,
          className: `px-4 py-2 rounded-md font-medium transition-colors ${saving ? "bg-gray-400 text-white cursor-not-allowed" : "bg-blue-600 text-white hover:bg-blue-700"}`,
          children: saving ? "\uC800\uC7A5 \uC911..." : "\uC124\uC815 \uC800\uC7A5"
        }
      )
    ] })
  ] }) });
};

// src/components/TemplateEditor.tsx
var import_react2 = require("react");
var import_jsx_runtime2 = require("react/jsx-runtime");
var TemplateEditor = ({
  template,
  onSave,
  onValidate,
  className = ""
}) => {
  const [formData, setFormData] = (0, import_react2.useState)({
    name: "",
    type: "email" /* EMAIL */,
    subject: "",
    content: "",
    language: "ko",
    variables: [],
    ...template
  });
  const [preview, setPreview] = (0, import_react2.useState)("");
  const [previewVariables, setPreviewVariables] = (0, import_react2.useState)({});
  const [errors, setErrors] = (0, import_react2.useState)({});
  const [saving, setSaving] = (0, import_react2.useState)(false);
  const [showPreview, setShowPreview] = (0, import_react2.useState)(false);
  const languages = [
    { code: "ko", name: "\uD55C\uAD6D\uC5B4" },
    { code: "en", name: "English" },
    { code: "ja", name: "\u65E5\u672C\u8A9E" },
    { code: "zh", name: "\u4E2D\u6587" }
  ];
  const variableExamples = {
    userName: "\uD64D\uAE38\uB3D9",
    userEmail: "user@example.com",
    orderNumber: "ORD-2024-0001",
    amount: 5e4,
    date: (/* @__PURE__ */ new Date()).toISOString(),
    productName: "\uC0D8\uD50C \uC0C1\uD488",
    companyName: "\uC6B0\uB9AC \uD68C\uC0AC"
  };
  (0, import_react2.useEffect)(() => {
    if (formData.content) {
      const variables = extractVariables(formData.content);
      setFormData((prev) => ({ ...prev, variables }));
      const defaultVars = {};
      variables.forEach((v) => {
        defaultVars[v] = variableExamples[v] || `{{${v}}}`;
      });
      setPreviewVariables(defaultVars);
    }
  }, [formData.content]);
  const extractVariables = (content) => {
    const regex = /\{\{[\s]*([a-zA-Z_$][a-zA-Z0-9_$\.]*)[\s]*\}\}/g;
    const variables = /* @__PURE__ */ new Set();
    let match;
    while ((match = regex.exec(content)) !== null) {
      variables.add(match[1]);
    }
    return Array.from(variables);
  };
  const handleContentChange = (content) => {
    setFormData((prev) => ({ ...prev, content }));
    if (onValidate) {
      const validation = onValidate(content);
      if (!validation.valid) {
        setErrors((prev) => ({ ...prev, content: validation.error || "Invalid template" }));
      } else {
        setErrors((prev) => ({ ...prev, content: "" }));
      }
    }
  };
  const generatePreview = () => {
    let previewContent = formData.content || "";
    Object.entries(previewVariables).forEach(([key, value]) => {
      const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, "g");
      previewContent = previewContent.replace(regex, value);
    });
    setPreview(previewContent);
    setShowPreview(true);
  };
  const handleSave = async () => {
    const newErrors = {};
    if (!formData.name) {
      newErrors.name = "\uD15C\uD50C\uB9BF \uC774\uB984\uC744 \uC785\uB825\uD558\uC138\uC694";
    }
    if (!formData.content) {
      newErrors.content = "\uD15C\uD50C\uB9BF \uB0B4\uC6A9\uC744 \uC785\uB825\uD558\uC138\uC694";
    }
    if (formData.type === "email" /* EMAIL */ && !formData.subject) {
      newErrors.subject = "\uC774\uBA54\uC77C \uC81C\uBAA9\uC744 \uC785\uB825\uD558\uC138\uC694";
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setSaving(true);
    try {
      await onSave(formData);
    } catch (error) {
      console.error("Failed to save template:", error);
    } finally {
      setSaving(false);
    }
  };
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: `template-editor ${className}`, children: /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "space-y-6", children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "grid grid-cols-2 gap-4", children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "\uD15C\uD50C\uB9BF \uC774\uB984 *" }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
          "input",
          {
            type: "text",
            className: `w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.name ? "border-red-500" : "border-gray-300"}`,
            value: formData.name,
            onChange: (e) => setFormData((prev) => ({ ...prev, name: e.target.value })),
            placeholder: "\uC608: \uC8FC\uBB38 \uD655\uC778 \uC774\uBA54\uC77C"
          }
        ),
        errors.name && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { className: "text-red-500 text-sm mt-1", children: errors.name })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "\uC54C\uB9BC \uC720\uD615 *" }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(
          "select",
          {
            className: "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500",
            value: formData.type,
            onChange: (e) => setFormData((prev) => ({
              ...prev,
              type: e.target.value
            })),
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("option", { value: "email" /* EMAIL */, children: "\uC774\uBA54\uC77C" }),
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("option", { value: "sms" /* SMS */, children: "SMS" }),
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("option", { value: "push" /* PUSH */, children: "\uD478\uC2DC \uC54C\uB9BC" }),
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("option", { value: "in_app" /* IN_APP */, children: "\uC778\uC571 \uC54C\uB9BC" })
            ]
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "\uC5B8\uC5B4" }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
        "select",
        {
          className: "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500",
          value: formData.language,
          onChange: (e) => setFormData((prev) => ({ ...prev, language: e.target.value })),
          children: languages.map((lang) => /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("option", { value: lang.code, children: lang.name }, lang.code))
        }
      )
    ] }),
    formData.type === "email" /* EMAIL */ && /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "\uC774\uBA54\uC77C \uC81C\uBAA9 *" }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
        "input",
        {
          type: "text",
          className: `w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.subject ? "border-red-500" : "border-gray-300"}`,
          value: formData.subject,
          onChange: (e) => setFormData((prev) => ({ ...prev, subject: e.target.value })),
          placeholder: "\uC608: {{companyName}} - \uC8FC\uBB38 \uD655\uC778 (\uC8FC\uBB38\uBC88\uD638: {{orderNumber}})"
        }
      ),
      errors.subject && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { className: "text-red-500 text-sm mt-1", children: errors.subject })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "\uD15C\uD50C\uB9BF \uB0B4\uC6A9 *" }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
        "textarea",
        {
          className: `w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.content ? "border-red-500" : "border-gray-300"}`,
          rows: 10,
          value: formData.content,
          onChange: (e) => handleContentChange(e.target.value),
          placeholder: `\uC548\uB155\uD558\uC138\uC694 {{userName}}\uB2D8,

\uC8FC\uBB38\uD574 \uC8FC\uC154\uC11C \uAC10\uC0AC\uD569\uB2C8\uB2E4. 
\uC8FC\uBB38\uBC88\uD638: {{orderNumber}}
\uACB0\uC81C\uAE08\uC561: {{currency amount "KRW" "ko-KR"}}

\uAC10\uC0AC\uD569\uB2C8\uB2E4.`
        }
      ),
      errors.content && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { className: "text-red-500 text-sm mt-1", children: errors.content })
    ] }),
    formData.variables && formData.variables.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("h4", { className: "text-sm font-medium text-gray-700 mb-2", children: [
        "\uC0AC\uC6A9\uB41C \uBCC0\uC218 (",
        formData.variables.length,
        "\uAC1C)"
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "flex flex-wrap gap-2", children: formData.variables.map((variable) => /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
        "span",
        {
          className: "px-2 py-1 bg-blue-100 text-blue-700 rounded-md text-sm",
          children: `{{${variable}}}`
        },
        variable
      )) })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "border-t pt-4", children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "flex justify-between items-center mb-4", children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("h4", { className: "font-medium", children: "\uBBF8\uB9AC\uBCF4\uAE30" }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
          "button",
          {
            type: "button",
            onClick: generatePreview,
            className: "px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-md text-sm",
            children: "\uBBF8\uB9AC\uBCF4\uAE30 \uC0DD\uC131"
          }
        )
      ] }),
      showPreview && formData.variables && formData.variables.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "space-y-4", children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("h5", { className: "text-sm font-medium text-gray-700 mb-2", children: "\uBBF8\uB9AC\uBCF4\uAE30 \uBCC0\uC218 \uAC12 \uC124\uC815" }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "grid grid-cols-2 gap-2", children: formData.variables.map((variable) => /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "flex items-center space-x-2", children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("label", { className: "text-sm text-gray-600 w-32", children: [
              `{{${variable}}}`,
              ":"
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
              "input",
              {
                type: "text",
                className: "flex-1 px-2 py-1 border border-gray-300 rounded text-sm",
                value: previewVariables[variable] || "",
                onChange: (e) => setPreviewVariables((prev) => ({
                  ...prev,
                  [variable]: e.target.value
                }))
              }
            )
          ] }, variable)) })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "bg-gray-50 p-4 rounded-md", children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("h5", { className: "text-sm font-medium text-gray-700 mb-2", children: "\uACB0\uACFC" }),
          formData.type === "email" /* EMAIL */ && formData.subject && /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "mb-2", children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "text-sm text-gray-600", children: "\uC81C\uBAA9: " }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "font-medium", children: formData.subject })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "whitespace-pre-wrap text-sm", children: preview })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "flex justify-end space-x-3", children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
      "button",
      {
        type: "button",
        onClick: handleSave,
        disabled: saving,
        className: `px-4 py-2 rounded-md font-medium transition-colors ${saving ? "bg-gray-400 text-white cursor-not-allowed" : "bg-blue-600 text-white hover:bg-blue-700"}`,
        children: saving ? "\uC800\uC7A5 \uC911..." : "\uD15C\uD50C\uB9BF \uC800\uC7A5"
      }
    ) })
  ] }) });
};

// src/components/NotificationHistory.tsx
var import_react3 = require("react");
var import_jsx_runtime3 = require("react/jsx-runtime");
var NotificationHistory = ({
  deliveries,
  onRefresh,
  onResend,
  className = ""
}) => {
  const [filter, setFilter] = (0, import_react3.useState)({
    type: "",
    status: "",
    search: ""
  });
  const [sortBy, setSortBy] = (0, import_react3.useState)("sentAt");
  const [sortOrder, setSortOrder] = (0, import_react3.useState)("desc");
  const [refreshing, setRefreshing] = (0, import_react3.useState)(false);
  const getStatusBadge = (status) => {
    const statusConfig = {
      ["pending" /* PENDING */]: { bg: "bg-gray-100", text: "text-gray-700", label: "\uB300\uAE30\uC911" },
      ["queued" /* QUEUED */]: { bg: "bg-blue-100", text: "text-blue-700", label: "\uB300\uAE30\uC5F4" },
      ["sending" /* SENDING */]: { bg: "bg-yellow-100", text: "text-yellow-700", label: "\uC804\uC1A1\uC911" },
      ["sent" /* SENT */]: { bg: "bg-green-100", text: "text-green-700", label: "\uC804\uC1A1\uB428" },
      ["delivered" /* DELIVERED */]: { bg: "bg-green-200", text: "text-green-800", label: "\uC804\uB2EC\uB428" },
      ["failed" /* FAILED */]: { bg: "bg-red-100", text: "text-red-700", label: "\uC2E4\uD328" },
      ["bounced" /* BOUNCED */]: { bg: "bg-orange-100", text: "text-orange-700", label: "\uBC18\uC1A1" }
    };
    const config = statusConfig[status] || statusConfig["pending" /* PENDING */];
    return /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: `px-2 py-1 text-xs font-medium rounded-full ${config.bg} ${config.text}`, children: config.label });
  };
  const getTypeIcon = (type) => {
    const icons = {
      ["email" /* EMAIL */]: "\u2709\uFE0F",
      ["sms" /* SMS */]: "\u{1F4AC}",
      ["push" /* PUSH */]: "\u{1F514}",
      ["in_app" /* IN_APP */]: "\u{1F4F1}"
    };
    return icons[type] || "\u{1F4E8}";
  };
  const filteredDeliveries = deliveries.filter((delivery) => {
    if (filter.type && delivery.type !== filter.type) return false;
    if (filter.status && delivery.status !== filter.status) return false;
    if (filter.search) {
      const searchLower = filter.search.toLowerCase();
      return delivery.recipient.toLowerCase().includes(searchLower) || delivery.notificationId.toLowerCase().includes(searchLower) || delivery.id.toLowerCase().includes(searchLower);
    }
    return true;
  });
  const sortedDeliveries = [...filteredDeliveries].sort((a, b) => {
    let compareValue = 0;
    switch (sortBy) {
      case "sentAt":
        const dateA = a.sentAt || /* @__PURE__ */ new Date(0);
        const dateB = b.sentAt || /* @__PURE__ */ new Date(0);
        compareValue = dateA.getTime() - dateB.getTime();
        break;
      case "type":
        compareValue = a.type.localeCompare(b.type);
        break;
      case "status":
        compareValue = a.status.localeCompare(b.status);
        break;
    }
    return sortOrder === "asc" ? compareValue : -compareValue;
  });
  const handleRefresh = async () => {
    if (onRefresh && !refreshing) {
      setRefreshing(true);
      await onRefresh();
      setRefreshing(false);
    }
  };
  const handleResend = async (delivery) => {
    if (onResend) {
      await onResend(delivery);
    }
  };
  const formatDate = (date) => {
    if (!date) return "-";
    const d = new Date(date);
    return new Intl.DateTimeFormat("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    }).format(d);
  };
  return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: `notification-history ${className}`, children: [
    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "mb-6 space-y-4", children: [
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "flex justify-between items-center", children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("h3", { className: "text-lg font-semibold", children: "\uC54C\uB9BC \uC804\uC1A1 \uB0B4\uC5ED" }),
        onRefresh && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
          "button",
          {
            onClick: handleRefresh,
            disabled: refreshing,
            className: "px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors disabled:opacity-50",
            children: refreshing ? "\uC0C8\uB85C\uACE0\uCE68 \uC911..." : "\uC0C8\uB85C\uACE0\uCE68"
          }
        )
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4", children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "\uAC80\uC0C9" }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
            "input",
            {
              type: "text",
              className: "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500",
              placeholder: "\uC218\uC2E0\uC790, ID\uB85C \uAC80\uC0C9...",
              value: filter.search,
              onChange: (e) => setFilter((prev) => ({ ...prev, search: e.target.value }))
            }
          )
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "\uC54C\uB9BC \uC720\uD615" }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(
            "select",
            {
              className: "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500",
              value: filter.type,
              onChange: (e) => setFilter((prev) => ({ ...prev, type: e.target.value })),
              children: [
                /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("option", { value: "", children: "\uC804\uCCB4" }),
                /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("option", { value: "email" /* EMAIL */, children: "\uC774\uBA54\uC77C" }),
                /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("option", { value: "sms" /* SMS */, children: "SMS" }),
                /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("option", { value: "push" /* PUSH */, children: "\uD478\uC2DC \uC54C\uB9BC" }),
                /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("option", { value: "in_app" /* IN_APP */, children: "\uC778\uC571 \uC54C\uB9BC" })
              ]
            }
          )
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "\uC0C1\uD0DC" }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(
            "select",
            {
              className: "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500",
              value: filter.status,
              onChange: (e) => setFilter((prev) => ({ ...prev, status: e.target.value })),
              children: [
                /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("option", { value: "", children: "\uC804\uCCB4" }),
                /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("option", { value: "pending" /* PENDING */, children: "\uB300\uAE30\uC911" }),
                /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("option", { value: "queued" /* QUEUED */, children: "\uB300\uAE30\uC5F4" }),
                /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("option", { value: "sending" /* SENDING */, children: "\uC804\uC1A1\uC911" }),
                /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("option", { value: "sent" /* SENT */, children: "\uC804\uC1A1\uB428" }),
                /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("option", { value: "delivered" /* DELIVERED */, children: "\uC804\uB2EC\uB428" }),
                /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("option", { value: "failed" /* FAILED */, children: "\uC2E4\uD328" }),
                /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("option", { value: "bounced" /* BOUNCED */, children: "\uBC18\uC1A1" })
              ]
            }
          )
        ] })
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "overflow-x-auto", children: /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("table", { className: "min-w-full divide-y divide-gray-200", children: [
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("thead", { className: "bg-gray-50", children: /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("tr", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "\uC720\uD615" }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "\uC218\uC2E0\uC790" }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(
          "th",
          {
            className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100",
            onClick: () => {
              if (sortBy === "status") {
                setSortOrder(sortOrder === "asc" ? "desc" : "asc");
              } else {
                setSortBy("status");
                setSortOrder("asc");
              }
            },
            children: [
              "\uC0C1\uD0DC",
              sortBy === "status" && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "ml-1", children: sortOrder === "asc" ? "\u2191" : "\u2193" })
            ]
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(
          "th",
          {
            className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100",
            onClick: () => {
              if (sortBy === "sentAt") {
                setSortOrder(sortOrder === "asc" ? "desc" : "asc");
              } else {
                setSortBy("sentAt");
                setSortOrder("desc");
              }
            },
            children: [
              "\uC804\uC1A1 \uC2DC\uAC04",
              sortBy === "sentAt" && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "ml-1", children: sortOrder === "asc" ? "\u2191" : "\u2193" })
            ]
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "\uC81C\uACF5\uC790" }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "\uC2DC\uB3C4" }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("th", { className: "relative px-6 py-3", children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "sr-only", children: "\uC791\uC5C5" }) })
      ] }) }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("tbody", { className: "bg-white divide-y divide-gray-200", children: sortedDeliveries.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("tr", { children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("td", { colSpan: 7, className: "px-6 py-4 text-center text-gray-500", children: "\uC804\uC1A1 \uB0B4\uC5ED\uC774 \uC5C6\uC2B5\uB2C8\uB2E4" }) }) : sortedDeliveries.map((delivery) => /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("tr", { className: "hover:bg-gray-50", children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("td", { className: "px-6 py-4 whitespace-nowrap", children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "text-2xl", children: getTypeIcon(delivery.type) }) }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("td", { className: "px-6 py-4 whitespace-nowrap", children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "text-sm text-gray-900", children: delivery.recipient }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "text-xs text-gray-500", children: delivery.notificationId })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("td", { className: "px-6 py-4 whitespace-nowrap", children: getStatusBadge(delivery.status) }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("td", { className: "px-6 py-4 whitespace-nowrap text-sm text-gray-900", children: formatDate(delivery.sentAt) }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("td", { className: "px-6 py-4 whitespace-nowrap text-sm text-gray-900", children: delivery.provider }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("td", { className: "px-6 py-4 whitespace-nowrap text-sm text-gray-900", children: delivery.attempts }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("td", { className: "px-6 py-4 whitespace-nowrap text-right text-sm font-medium", children: delivery.status === "failed" /* FAILED */ && onResend && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
          "button",
          {
            onClick: () => handleResend(delivery),
            className: "text-blue-600 hover:text-blue-900",
            children: "\uC7AC\uC804\uC1A1"
          }
        ) })
      ] }, delivery.id)) })
    ] }) }),
    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "mt-4 grid grid-cols-2 md:grid-cols-4 gap-4", children: [
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "bg-gray-50 p-4 rounded-lg", children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("p", { className: "text-sm text-gray-600", children: "\uC804\uCCB4" }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("p", { className: "text-2xl font-semibold", children: deliveries.length })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "bg-green-50 p-4 rounded-lg", children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("p", { className: "text-sm text-gray-600", children: "\uC131\uACF5" }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("p", { className: "text-2xl font-semibold text-green-600", children: deliveries.filter((d) => d.status === "delivered" /* DELIVERED */).length })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "bg-red-50 p-4 rounded-lg", children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("p", { className: "text-sm text-gray-600", children: "\uC2E4\uD328" }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("p", { className: "text-2xl font-semibold text-red-600", children: deliveries.filter((d) => d.status === "failed" /* FAILED */ || d.status === "bounced" /* BOUNCED */).length })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "bg-blue-50 p-4 rounded-lg", children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("p", { className: "text-sm text-gray-600", children: "\uB300\uAE30\uC911" }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("p", { className: "text-2xl font-semibold text-blue-600", children: deliveries.filter((d) => d.status === "pending" /* PENDING */ || d.status === "queued" /* QUEUED */).length })
      ] })
    ] })
  ] });
};

// src/components/TestSender.tsx
var import_react4 = require("react");
var import_jsx_runtime4 = require("react/jsx-runtime");
var TestSender = ({
  templates = [],
  onSend,
  className = ""
}) => {
  const [formData, setFormData] = (0, import_react4.useState)({
    type: "email" /* EMAIL */,
    recipient: {
      email: "",
      phone: "",
      userId: ""
    },
    templateId: "",
    customContent: false,
    content: {
      subject: "",
      body: ""
    },
    variables: {},
    priority: "normal" /* NORMAL */
  });
  const [sending, setSending] = (0, import_react4.useState)(false);
  const [result, setResult] = (0, import_react4.useState)(null);
  const selectedTemplate = templates.find((t) => t.id === formData.templateId);
  const handleTypeChange = (type) => {
    setFormData((prev) => ({
      ...prev,
      type,
      templateId: "",
      variables: {}
    }));
    setResult(null);
  };
  const handleTemplateChange = (templateId) => {
    const template = templates.find((t) => t.id === templateId);
    const variables = {};
    if (template) {
      template.variables.forEach((v) => {
        variables[v] = "";
      });
    }
    setFormData((prev) => ({
      ...prev,
      templateId,
      variables,
      customContent: false
    }));
  };
  const handleSend = async () => {
    setSending(true);
    setResult(null);
    try {
      const request = {
        type: formData.type,
        recipient: formData.recipient,
        priority: formData.priority
      };
      if (formData.customContent) {
        request.content = formData.content;
      } else if (formData.templateId) {
        request.templateId = formData.templateId;
        request.variables = formData.variables;
      }
      const response = await onSend(request);
      setResult(response);
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      });
    } finally {
      setSending(false);
    }
  };
  const isValidRecipient = () => {
    switch (formData.type) {
      case "email" /* EMAIL */:
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.recipient.email);
      case "sms" /* SMS */:
        return /^[0-9]{10,15}$/.test(formData.recipient.phone.replace(/\D/g, ""));
      default:
        return true;
    }
  };
  return /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: `test-sender ${className}`, children: /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "space-y-6", children: [
    /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { children: [
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("h3", { className: "text-lg font-semibold mb-4", children: "\uC54C\uB9BC \uD14C\uC2A4\uD2B8 \uC804\uC1A1" }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("p", { className: "text-sm text-gray-600 mb-4", children: "\uC54C\uB9BC\uC744 \uD14C\uC2A4\uD2B8\uB85C \uC804\uC1A1\uD558\uC5EC \uD15C\uD50C\uB9BF\uACFC \uC124\uC815\uC744 \uD655\uC778\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4." })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { children: [
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "\uC54C\uB9BC \uC720\uD615" }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-2", children: Object.values(NotificationType).map((type) => /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(
        "button",
        {
          type: "button",
          onClick: () => handleTypeChange(type),
          className: `px-4 py-2 rounded-md text-sm font-medium transition-colors ${formData.type === type ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`,
          children: [
            type === "email" /* EMAIL */ && "\uC774\uBA54\uC77C",
            type === "sms" /* SMS */ && "SMS",
            type === "push" /* PUSH */ && "\uD478\uC2DC \uC54C\uB9BC",
            type === "in_app" /* IN_APP */ && "\uC778\uC571 \uC54C\uB9BC"
          ]
        },
        type
      )) })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { children: [
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "\uC218\uC2E0\uC790" }),
      formData.type === "email" /* EMAIL */ && /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
        "input",
        {
          type: "email",
          className: "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500",
          placeholder: "test@example.com",
          value: formData.recipient.email,
          onChange: (e) => setFormData((prev) => ({
            ...prev,
            recipient: { ...prev.recipient, email: e.target.value }
          }))
        }
      ),
      formData.type === "sms" /* SMS */ && /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
        "input",
        {
          type: "tel",
          className: "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500",
          placeholder: "010-1234-5678",
          value: formData.recipient.phone,
          onChange: (e) => setFormData((prev) => ({
            ...prev,
            recipient: { ...prev.recipient, phone: e.target.value }
          }))
        }
      )
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { children: [
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "\uC6B0\uC120\uC21C\uC704" }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(
        "select",
        {
          className: "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500",
          value: formData.priority,
          onChange: (e) => setFormData((prev) => ({
            ...prev,
            priority: e.target.value
          })),
          children: [
            /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("option", { value: "low" /* LOW */, children: "\uB0AE\uC74C" }),
            /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("option", { value: "normal" /* NORMAL */, children: "\uBCF4\uD1B5" }),
            /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("option", { value: "high" /* HIGH */, children: "\uB192\uC74C" }),
            /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("option", { value: "urgent" /* URGENT */, children: "\uAE34\uAE09" })
          ]
        }
      )
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { children: [
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "\uCF58\uD150\uCE20 \uC720\uD615" }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "flex space-x-4", children: [
        /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("label", { className: "flex items-center", children: [
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
            "input",
            {
              type: "radio",
              className: "mr-2",
              checked: !formData.customContent,
              onChange: () => setFormData((prev) => ({ ...prev, customContent: false }))
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: "text-sm", children: "\uD15C\uD50C\uB9BF \uC0AC\uC6A9" })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("label", { className: "flex items-center", children: [
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
            "input",
            {
              type: "radio",
              className: "mr-2",
              checked: formData.customContent,
              onChange: () => setFormData((prev) => ({ ...prev, customContent: true }))
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: "text-sm", children: "\uC9C1\uC811 \uC785\uB825" })
        ] })
      ] })
    ] }),
    !formData.customContent && /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { children: [
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "\uD15C\uD50C\uB9BF \uC120\uD0DD" }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(
        "select",
        {
          className: "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500",
          value: formData.templateId,
          onChange: (e) => handleTemplateChange(e.target.value),
          children: [
            /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("option", { value: "", children: "\uD15C\uD50C\uB9BF\uC744 \uC120\uD0DD\uD558\uC138\uC694" }),
            templates.filter((t) => t.type === formData.type).map((template) => /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("option", { value: template.id, children: template.name }, template.id))
          ]
        }
      ),
      selectedTemplate && selectedTemplate.variables.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "mt-4 space-y-2", children: [
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("p", { className: "text-sm font-medium text-gray-700", children: "\uD15C\uD50C\uB9BF \uBCC0\uC218" }),
        selectedTemplate.variables.map((variable) => /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "flex items-center space-x-2", children: [
          /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("label", { className: "text-sm text-gray-600 w-32", children: [
            `{{${variable}}}`,
            ":"
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
            "input",
            {
              type: "text",
              className: "flex-1 px-2 py-1 border border-gray-300 rounded text-sm",
              value: formData.variables[variable] || "",
              onChange: (e) => setFormData((prev) => ({
                ...prev,
                variables: {
                  ...prev.variables,
                  [variable]: e.target.value
                }
              }))
            }
          )
        ] }, variable))
      ] })
    ] }),
    formData.customContent && /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "space-y-4", children: [
      formData.type === "email" /* EMAIL */ && /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "\uC81C\uBAA9" }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
          "input",
          {
            type: "text",
            className: "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500",
            value: formData.content.subject,
            onChange: (e) => setFormData((prev) => ({
              ...prev,
              content: { ...prev.content, subject: e.target.value }
            }))
          }
        )
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "\uB0B4\uC6A9" }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
          "textarea",
          {
            className: "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500",
            rows: 5,
            value: formData.content.body,
            onChange: (e) => setFormData((prev) => ({
              ...prev,
              content: { ...prev.content, body: e.target.value }
            }))
          }
        )
      ] })
    ] }),
    result && /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: `p-4 rounded-md ${result.success ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`, children: [
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("h4", { className: "font-medium mb-1", children: result.success ? "\uC804\uC1A1 \uC131\uACF5" : "\uC804\uC1A1 \uC2E4\uD328" }),
      result.messageId && /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("p", { className: "text-sm", children: [
        "\uBA54\uC2DC\uC9C0 ID: ",
        result.messageId
      ] }),
      result.error && /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("p", { className: "text-sm", children: [
        "\uC624\uB958: ",
        result.error
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: "flex justify-end", children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
      "button",
      {
        type: "button",
        onClick: handleSend,
        disabled: sending || !isValidRecipient() || !formData.templateId && !formData.customContent,
        className: `px-4 py-2 rounded-md font-medium transition-colors ${sending || !isValidRecipient() || !formData.templateId && !formData.customContent ? "bg-gray-400 text-white cursor-not-allowed" : "bg-blue-600 text-white hover:bg-blue-700"}`,
        children: sending ? "\uC804\uC1A1 \uC911..." : "\uD14C\uC2A4\uD2B8 \uC804\uC1A1"
      }
    ) })
  ] }) });
};

// src/hooks/useNotification.ts
var import_react5 = require("react");
var useNotification = (options = {}) => {
  const [loading, setLoading] = (0, import_react5.useState)(false);
  const [error, setError] = (0, import_react5.useState)(null);
  const [deliveries, setDeliveries] = (0, import_react5.useState)([]);
  const [templates, setTemplates] = (0, import_react5.useState)([]);
  const sendNotification = (0, import_react5.useCallback)(async (request) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${options.apiUrl || "/api"}/notifications/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request)
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Failed to send notification");
      }
      options.onSuccess?.(result);
      return { success: true, notificationId: result.notificationId };
    } catch (err) {
      const error2 = err instanceof Error ? err : new Error("Unknown error");
      setError(error2);
      options.onError?.(error2);
      return { success: false, error: error2.message };
    } finally {
      setLoading(false);
    }
  }, [options]);
  const sendBulkNotifications = (0, import_react5.useCallback)(async (requests) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${options.apiUrl || "/api"}/notifications/send-bulk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notifications: requests })
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Failed to send bulk notifications");
      }
      return new Map(Object.entries(result.results));
    } catch (err) {
      const error2 = err instanceof Error ? err : new Error("Unknown error");
      setError(error2);
      options.onError?.(error2);
      return /* @__PURE__ */ new Map();
    } finally {
      setLoading(false);
    }
  }, [options]);
  const fetchDeliveries = (0, import_react5.useCallback)(async (filter) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filter?.startDate) params.append("startDate", filter.startDate.toISOString());
      if (filter?.endDate) params.append("endDate", filter.endDate.toISOString());
      if (filter?.type) params.append("type", filter.type);
      if (filter?.status) params.append("status", filter.status);
      if (filter?.recipient) params.append("recipient", filter.recipient);
      const response = await fetch(
        `${options.apiUrl || "/api"}/notifications/deliveries?${params}`
      );
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Failed to fetch deliveries");
      }
      setDeliveries(result.deliveries);
      return result.deliveries;
    } catch (err) {
      const error2 = err instanceof Error ? err : new Error("Unknown error");
      setError(error2);
      options.onError?.(error2);
      return [];
    } finally {
      setLoading(false);
    }
  }, [options]);
  const fetchTemplates = (0, import_react5.useCallback)(async (type, language) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (type) params.append("type", type);
      if (language) params.append("language", language);
      const response = await fetch(
        `${options.apiUrl || "/api"}/notifications/templates?${params}`
      );
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Failed to fetch templates");
      }
      setTemplates(result.templates);
      return result.templates;
    } catch (err) {
      const error2 = err instanceof Error ? err : new Error("Unknown error");
      setError(error2);
      options.onError?.(error2);
      return [];
    } finally {
      setLoading(false);
    }
  }, [options]);
  const saveTemplate = (0, import_react5.useCallback)(async (template) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${options.apiUrl || "/api"}/notifications/templates`, {
        method: template.id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(template)
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Failed to save template");
      }
      await fetchTemplates();
      return true;
    } catch (err) {
      const error2 = err instanceof Error ? err : new Error("Unknown error");
      setError(error2);
      options.onError?.(error2);
      return false;
    } finally {
      setLoading(false);
    }
  }, [options, fetchTemplates]);
  const updateUserPreferences = (0, import_react5.useCallback)(async (userId, preferences) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `${options.apiUrl || "/api"}/notifications/preferences/${userId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(preferences)
        }
      );
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Failed to update preferences");
      }
      return true;
    } catch (err) {
      const error2 = err instanceof Error ? err : new Error("Unknown error");
      setError(error2);
      options.onError?.(error2);
      return false;
    } finally {
      setLoading(false);
    }
  }, [options]);
  const resendNotification = (0, import_react5.useCallback)(async (delivery) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `${options.apiUrl || "/api"}/notifications/resend/${delivery.id}`,
        { method: "POST" }
      );
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Failed to resend notification");
      }
      await fetchDeliveries();
      return true;
    } catch (err) {
      const error2 = err instanceof Error ? err : new Error("Unknown error");
      setError(error2);
      options.onError?.(error2);
      return false;
    } finally {
      setLoading(false);
    }
  }, [options, fetchDeliveries]);
  const getDeliveryStats = (0, import_react5.useCallback)(async (startDate, endDate, type) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      });
      if (type) params.append("type", type);
      const response = await fetch(
        `${options.apiUrl || "/api"}/notifications/stats?${params}`
      );
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Failed to fetch stats");
      }
      return result.stats;
    } catch (err) {
      const error2 = err instanceof Error ? err : new Error("Unknown error");
      setError(error2);
      options.onError?.(error2);
      return null;
    } finally {
      setLoading(false);
    }
  }, [options]);
  return {
    // State
    loading,
    error,
    deliveries,
    templates,
    // Actions
    sendNotification,
    sendBulkNotifications,
    fetchDeliveries,
    fetchTemplates,
    saveTemplate,
    updateUserPreferences,
    resendNotification,
    getDeliveryStats
  };
};

// src/hooks/useNotificationPreferences.ts
var import_react6 = require("react");
var useNotificationPreferences = ({
  userId,
  apiUrl = "/api",
  defaultPreferences
}) => {
  const [preferences, setPreferences] = (0, import_react6.useState)(null);
  const [loading, setLoading] = (0, import_react6.useState)(true);
  const [error, setError] = (0, import_react6.useState)(null);
  const [saving, setSaving] = (0, import_react6.useState)(false);
  const fetchPreferences = (0, import_react6.useCallback)(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${apiUrl}/notifications/preferences/${userId}`);
      if (response.status === 404 && defaultPreferences) {
        setPreferences(defaultPreferences);
        return;
      }
      if (!response.ok) {
        throw new Error("Failed to fetch preferences");
      }
      const data = await response.json();
      setPreferences(data.preferences);
    } catch (err) {
      const error2 = err instanceof Error ? err : new Error("Unknown error");
      setError(error2);
      if (defaultPreferences) {
        setPreferences(defaultPreferences);
      }
    } finally {
      setLoading(false);
    }
  }, [userId, apiUrl, defaultPreferences]);
  const savePreferences = (0, import_react6.useCallback)(async (newPreferences) => {
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`${apiUrl}/notifications/preferences/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newPreferences)
      });
      if (!response.ok) {
        throw new Error("Failed to save preferences");
      }
      setPreferences(newPreferences);
      return true;
    } catch (err) {
      const error2 = err instanceof Error ? err : new Error("Unknown error");
      setError(error2);
      return false;
    } finally {
      setSaving(false);
    }
  }, [userId, apiUrl]);
  const toggleChannel = (0, import_react6.useCallback)((channel) => {
    if (!preferences) return;
    const updated = {
      ...preferences,
      channels: {
        ...preferences.channels,
        [channel]: {
          ...preferences.channels[channel],
          enabled: !preferences.channels[channel].enabled
        }
      }
    };
    setPreferences(updated);
  }, [preferences]);
  const toggleCategory = (0, import_react6.useCallback)((channel, category) => {
    if (!preferences) return;
    const currentValue = preferences.channels[channel].categories[category] !== false;
    const updated = {
      ...preferences,
      channels: {
        ...preferences.channels,
        [channel]: {
          ...preferences.channels[channel],
          categories: {
            ...preferences.channels[channel].categories,
            [category]: !currentValue
          }
        }
      }
    };
    setPreferences(updated);
  }, [preferences]);
  const toggleQuietHours = (0, import_react6.useCallback)(() => {
    if (!preferences) return;
    const updated = {
      ...preferences,
      quiet: {
        ...preferences.quiet,
        enabled: !preferences.quiet.enabled
      }
    };
    setPreferences(updated);
  }, [preferences]);
  const updateQuietHours = (0, import_react6.useCallback)((start, end) => {
    if (!preferences) return;
    const updated = {
      ...preferences,
      quiet: {
        ...preferences.quiet,
        start,
        end
      }
    };
    setPreferences(updated);
  }, [preferences]);
  const canReceiveNotification = (0, import_react6.useCallback)((type, category) => {
    if (!preferences) return true;
    const channelKey = type.toLowerCase();
    const channel = preferences.channels[channelKey];
    if (!channel?.enabled) return false;
    if (category && channel.categories) {
      if (channel.categories[category] === false) return false;
    }
    if (preferences.quiet.enabled) {
      const now = /* @__PURE__ */ new Date();
      const currentTime = now.getHours() * 60 + now.getMinutes();
      const [startHour, startMin] = preferences.quiet.start.split(":").map(Number);
      const [endHour, endMin] = preferences.quiet.end.split(":").map(Number);
      const quietStart = startHour * 60 + startMin;
      const quietEnd = endHour * 60 + endMin;
      if (quietStart <= quietEnd) {
        if (currentTime >= quietStart && currentTime <= quietEnd) {
          return false;
        }
      } else {
        if (currentTime >= quietStart || currentTime <= quietEnd) {
          return false;
        }
      }
    }
    return true;
  }, [preferences]);
  (0, import_react6.useEffect)(() => {
    fetchPreferences();
  }, [fetchPreferences]);
  return {
    preferences,
    loading,
    error,
    saving,
    // Actions
    savePreferences,
    toggleChannel,
    toggleCategory,
    toggleQuietHours,
    updateQuietHours,
    canReceiveNotification,
    refetch: fetchPreferences
  };
};

// src/utils/templateHelpers.ts
var extractTemplateVariables = (content) => {
  const regex = /\{\{[\s]*([a-zA-Z_$][a-zA-Z0-9_$\.]*)[\s]*\}\}/g;
  const variables = /* @__PURE__ */ new Set();
  let match;
  while ((match = regex.exec(content)) !== null) {
    variables.add(match[1]);
  }
  return Array.from(variables);
};
var validateTemplateSyntax = (content) => {
  try {
    const openCount = (content.match(/\{\{/g) || []).length;
    const closeCount = (content.match(/\}\}/g) || []).length;
    if (openCount !== closeCount) {
      return {
        valid: false,
        error: "Mismatched template brackets"
      };
    }
    const invalidVarRegex = /\{\{[\s]*[^a-zA-Z_$].*?\}\}/g;
    if (invalidVarRegex.test(content)) {
      return {
        valid: false,
        error: "Invalid variable name. Variables must start with a letter, $ or _"
      };
    }
    const variables = extractTemplateVariables(content);
    return { valid: true, variables };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : "Invalid template syntax"
    };
  }
};
var generateSampleData = (variables) => {
  const sampleData = {};
  const samples = {
    // User-related
    userName: "\uD64D\uAE38\uB3D9",
    userEmail: "user@example.com",
    userId: "USER123",
    firstName: "\uAE38\uB3D9",
    lastName: "\uD64D",
    phoneNumber: "010-1234-5678",
    // Order-related
    orderNumber: "ORD-2024-0001",
    orderDate: (/* @__PURE__ */ new Date()).toISOString(),
    orderStatus: "\uBC30\uC1A1\uC911",
    trackingNumber: "1234567890",
    deliveryDate: new Date(Date.now() + 864e5 * 3).toISOString(),
    // Product-related
    productName: "\uC0D8\uD50C \uC0C1\uD488",
    productId: "PROD123",
    quantity: 2,
    price: 5e4,
    totalAmount: 1e5,
    // Company-related
    companyName: "\uC6B0\uB9AC \uD68C\uC0AC",
    companyEmail: "support@company.com",
    companyPhone: "02-1234-5678",
    // Common
    date: (/* @__PURE__ */ new Date()).toISOString(),
    time: (/* @__PURE__ */ new Date()).toTimeString().slice(0, 5),
    url: "https://example.com",
    code: "ABC123",
    password: "TempPass123!",
    // Korean specific
    recipientName: "\uC218\uC2E0\uC790\uBA85",
    senderName: "\uBC1C\uC2E0\uC790\uBA85",
    address: "\uC11C\uC6B8\uC2DC \uAC15\uB0A8\uAD6C \uD14C\uD5E4\uB780\uB85C 123",
    postalCode: "06234"
  };
  variables.forEach((variable) => {
    if (samples[variable] !== void 0) {
      sampleData[variable] = samples[variable];
    } else {
      if (variable.includes("Date")) {
        sampleData[variable] = (/* @__PURE__ */ new Date()).toISOString();
      } else if (variable.includes("Amount") || variable.includes("Price")) {
        sampleData[variable] = 1e4;
      } else if (variable.includes("Count") || variable.includes("Quantity")) {
        sampleData[variable] = 1;
      } else if (variable.includes("Email")) {
        sampleData[variable] = "example@email.com";
      } else if (variable.includes("Phone")) {
        sampleData[variable] = "010-0000-0000";
      } else if (variable.includes("Name")) {
        sampleData[variable] = "\uC774\uB984";
      } else {
        sampleData[variable] = `{{${variable}}}`;
      }
    }
  });
  return sampleData;
};
var getTemplateCharacterCount = (content, variables) => {
  let processedContent = content;
  if (variables) {
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, "g");
      processedContent = processedContent.replace(regex, String(value));
    });
  }
  const bytes = Buffer.from(processedContent, "utf-8").length;
  const count = processedContent.length;
  let type;
  if (bytes <= 90) {
    type = "SMS";
  } else if (bytes <= 2e3) {
    type = "LMS";
  } else {
    type = "MMS";
  }
  return { count, bytes, type };
};
var validateTemplateForType = (template, type) => {
  const errors = [];
  if (!template.content) {
    errors.push("\uD15C\uD50C\uB9BF \uB0B4\uC6A9\uC774 \uD544\uC694\uD569\uB2C8\uB2E4");
  }
  switch (type) {
    case "email" /* EMAIL */:
      if (!template.subject) {
        errors.push("\uC774\uBA54\uC77C \uD15C\uD50C\uB9BF\uC5D0\uB294 \uC81C\uBAA9\uC774 \uD544\uC694\uD569\uB2C8\uB2E4");
      }
      break;
    case "sms" /* SMS */:
      if (template.content) {
        const { bytes } = getTemplateCharacterCount(template.content);
        if (bytes > 2e3) {
          errors.push("SMS \uB0B4\uC6A9\uC774 \uB108\uBB34 \uAE41\uB2C8\uB2E4 (\uCD5C\uB300 2000 \uBC14\uC774\uD2B8)");
        }
      }
      break;
  }
  return {
    valid: errors.length === 0,
    errors
  };
};
var formatPhoneNumber = (phone) => {
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.startsWith("010")) {
    return cleaned.replace(/(\d{3})(\d{4})(\d{4})/, "$1-$2-$3");
  } else if (cleaned.startsWith("01")) {
    return cleaned.replace(/(\d{3})(\d{3,4})(\d{4})/, "$1-$2-$3");
  } else if (cleaned.startsWith("82")) {
    const localNumber = cleaned.substring(2);
    if (localNumber.startsWith("10")) {
      return `+82-${localNumber.substring(0, 2)}-${localNumber.substring(2, 6)}-${localNumber.substring(6)}`;
    }
  }
  return phone;
};
var sanitizeTemplateContent = (content) => {
  return content.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "").replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "").replace(/javascript:/gi, "").replace(/on\w+\s*=/gi, "");
};

// src/utils/validation.ts
var import_zod2 = require("zod");
var validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};
var validateKoreanPhoneNumber = (phone) => {
  const cleaned = phone.replace(/\D/g, "");
  const mobileRegex = /^(010|011|016|017|018|019)\d{7,8}$/;
  const landlineRegex = /^(02|0[3-6][1-5])\d{7,8}$/;
  const internationalRegex = /^82(10|11|16|17|18|19|2|[3-6][1-5])\d{7,8}$/;
  return mobileRegex.test(cleaned) || landlineRegex.test(cleaned) || internationalRegex.test(cleaned);
};
var validateNotificationRequest = (request) => {
  const errors = [];
  switch (request.type) {
    case "email" /* EMAIL */:
      if (!request.recipient.email) {
        errors.push("\uC774\uBA54\uC77C \uC8FC\uC18C\uAC00 \uD544\uC694\uD569\uB2C8\uB2E4");
      } else if (!validateEmail(request.recipient.email)) {
        errors.push("\uC720\uD6A8\uD558\uC9C0 \uC54A\uC740 \uC774\uBA54\uC77C \uC8FC\uC18C\uC785\uB2C8\uB2E4");
      }
      break;
    case "sms" /* SMS */:
      if (!request.recipient.phone) {
        errors.push("\uC804\uD654\uBC88\uD638\uAC00 \uD544\uC694\uD569\uB2C8\uB2E4");
      } else if (!validateKoreanPhoneNumber(request.recipient.phone)) {
        errors.push("\uC720\uD6A8\uD558\uC9C0 \uC54A\uC740 \uC804\uD654\uBC88\uD638\uC785\uB2C8\uB2E4");
      }
      break;
    case "push" /* PUSH */:
      if (!request.recipient.deviceToken && !request.recipient.userId) {
        errors.push("\uB514\uBC14\uC774\uC2A4 \uD1A0\uD070 \uB610\uB294 \uC0AC\uC6A9\uC790 ID\uAC00 \uD544\uC694\uD569\uB2C8\uB2E4");
      }
      break;
    case "in_app" /* IN_APP */:
      if (!request.recipient.userId) {
        errors.push("\uC0AC\uC6A9\uC790 ID\uAC00 \uD544\uC694\uD569\uB2C8\uB2E4");
      }
      break;
  }
  if (!request.templateId && !request.content) {
    errors.push("\uD15C\uD50C\uB9BF ID \uB610\uB294 \uCF58\uD150\uCE20\uAC00 \uD544\uC694\uD569\uB2C8\uB2E4");
  }
  if (request.content) {
    if (!request.content.body) {
      errors.push("\uBA54\uC2DC\uC9C0 \uBCF8\uBB38\uC774 \uD544\uC694\uD569\uB2C8\uB2E4");
    }
    if (request.type === "email" /* EMAIL */ && !request.content.subject) {
      errors.push("\uC774\uBA54\uC77C \uC81C\uBAA9\uC774 \uD544\uC694\uD569\uB2C8\uB2E4");
    }
  }
  if (request.scheduledAt && new Date(request.scheduledAt) < /* @__PURE__ */ new Date()) {
    errors.push("\uC608\uC57D \uC2DC\uAC04\uC740 \uD604\uC7AC \uC2DC\uAC04 \uC774\uD6C4\uC5EC\uC57C \uD569\uB2C8\uB2E4");
  }
  return {
    valid: errors.length === 0,
    errors
  };
};
var validateTemplate = (template) => {
  const errors = [];
  if (!template.name || template.name.trim().length === 0) {
    errors.push("\uD15C\uD50C\uB9BF \uC774\uB984\uC774 \uD544\uC694\uD569\uB2C8\uB2E4");
  }
  if (!template.content || template.content.trim().length === 0) {
    errors.push("\uD15C\uD50C\uB9BF \uB0B4\uC6A9\uC774 \uD544\uC694\uD569\uB2C8\uB2E4");
  }
  if (template.type === "email" /* EMAIL */ && !template.subject) {
    errors.push("\uC774\uBA54\uC77C \uD15C\uD50C\uB9BF\uC5D0\uB294 \uC81C\uBAA9\uC774 \uD544\uC694\uD569\uB2C8\uB2E4");
  }
  if (!template.language) {
    errors.push("\uC5B8\uC5B4 \uC124\uC815\uC774 \uD544\uC694\uD569\uB2C8\uB2E4");
  }
  if (template.content) {
    try {
      const openCount = (template.content.match(/\{\{/g) || []).length;
      const closeCount = (template.content.match(/\}\}/g) || []).length;
      if (openCount !== closeCount) {
        errors.push("\uD15C\uD50C\uB9BF \uAD6C\uBB38 \uC624\uB958: \uAD04\uD638\uAC00 \uC77C\uCE58\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4");
      }
    } catch (error) {
      errors.push("\uD15C\uD50C\uB9BF \uAD6C\uBB38 \uAC80\uC99D \uC2E4\uD328");
    }
  }
  return {
    valid: errors.length === 0,
    errors
  };
};
var EmailRecipientSchema = import_zod2.z.object({
  email: import_zod2.z.string().email("\uC720\uD6A8\uD558\uC9C0 \uC54A\uC740 \uC774\uBA54\uC77C \uC8FC\uC18C\uC785\uB2C8\uB2E4"),
  userId: import_zod2.z.string().optional(),
  locale: import_zod2.z.string().optional()
});
var SMSRecipientSchema = import_zod2.z.object({
  phone: import_zod2.z.string().refine(validateKoreanPhoneNumber, {
    message: "\uC720\uD6A8\uD558\uC9C0 \uC54A\uC740 \uC804\uD654\uBC88\uD638\uC785\uB2C8\uB2E4"
  }),
  userId: import_zod2.z.string().optional(),
  locale: import_zod2.z.string().optional()
});
var NotificationContentSchema = import_zod2.z.object({
  subject: import_zod2.z.string().optional(),
  body: import_zod2.z.string().min(1, "\uBA54\uC2DC\uC9C0 \uBCF8\uBB38\uC774 \uD544\uC694\uD569\uB2C8\uB2E4"),
  html: import_zod2.z.string().optional()
});
var TemplateVariablesSchema = import_zod2.z.record(import_zod2.z.any());
var validateBulkNotifications = (requests) => {
  const errors = [];
  requests.forEach((request, index) => {
    const validation = validateNotificationRequest(request);
    if (!validation.valid) {
      errors.push({ index, errors: validation.errors });
    }
  });
  return {
    valid: errors.length === 0,
    errors
  };
};
var sanitizeInput = (input) => {
  return input.replace(/[<>]/g, "").replace(/javascript:/gi, "").trim();
};
var validateAttachment = (file) => {
  const maxSize = 10 * 1024 * 1024;
  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ];
  if (file.size > maxSize) {
    return { valid: false, error: "\uD30C\uC77C \uD06C\uAE30\uB294 10MB\uB97C \uCD08\uACFC\uD560 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4" };
  }
  if (file.contentType && !allowedTypes.includes(file.contentType)) {
    return { valid: false, error: "\uD5C8\uC6A9\uB418\uC9C0 \uC54A\uC740 \uD30C\uC77C \uD615\uC2DD\uC785\uB2C8\uB2E4" };
  }
  return { valid: true };
};

// src/index.ts
var createNotificationService = (config) => {
  return new NotificationService(config);
};
var index_default = {
  createNotificationService
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  DeliveryStatus,
  DeliveryTrackingService,
  EmailRecipientSchema,
  EmailService,
  NotificationContentSchema,
  NotificationHistory,
  NotificationPreferencesComponent,
  NotificationPriority,
  NotificationRequestSchema,
  NotificationService,
  NotificationType,
  QueueService,
  SMSRecipientSchema,
  SMSService,
  TemplateEditor,
  TemplateEngine,
  TemplateSchema,
  TemplateVariablesSchema,
  TestSender,
  createNotificationService,
  extractTemplateVariables,
  formatPhoneNumber,
  generateSampleData,
  getTemplateCharacterCount,
  sanitizeInput,
  sanitizeTemplateContent,
  useNotification,
  useNotificationPreferences,
  validateAttachment,
  validateBulkNotifications,
  validateEmail,
  validateKoreanPhoneNumber,
  validateNotificationRequest,
  validateTemplate,
  validateTemplateForType,
  validateTemplateSyntax
});
