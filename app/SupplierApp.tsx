'use client';

import {
  Activity,
  AlertTriangle,
  BarChart3,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  ClipboardCopy,
  Database,
  Eye,
  EyeOff,
  FileKey2,
  Gauge,
  Inbox,
  Info,
  Loader2,
  LockKeyhole,
  LogOut,
  Menu,
  Plus,
  RefreshCcw,
  Search,
  ShieldCheck,
  Tag,
  Trash2,
  UploadCloud,
  User,
  Users,
  X,
  XCircle,
  Zap,
} from 'lucide-react';
import type { ComponentType, CSSProperties, FormEvent, ReactNode } from 'react';
import { Fragment, createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

type ApiEnvelope<T> = {
  code?: number | string;
  success?: boolean;
  data?: T;
  message?: string;
  request_id?: string;
};

type ApiRequestInit = RequestInit & {
  fresh?: boolean;
};

type UserProfile = {
  id?: number;
  user_id?: number;
  username: string;
  display_name?: string;
  role: 'admin' | 'supplier' | 'sub' | string;
};

type DashboardData = {
  attention?: ChannelItem[] | null;
  categories?: Array<{
    category: string;
    count: number;
  }> | null;
  channels?: {
    total?: number;
    enabled?: number;
    disabled?: number;
    auto_disabled?: number;
    quota_used?: number;
    scored?: number;
    good?: number;
    warn?: number;
    bad?: number;
    avg_sr?: number | null;
    last_scored?: string | null;
  };
  display_name?: string;
  instances?: {
    enabled?: number;
    total?: number;
  };
  role?: string;
  scheduler?: {
    enabled?: boolean;
    window_minutes?: number;
  };
  server_time?: string;
  suppliers?: number;
};

type ChannelItem = {
  id: number;
  name?: string;
  channel_name?: string;
  supplier_name?: string;
  category?: string;
  type?: number;
  tag?: string;
  remark?: string;
  key?: string;
  key_masked?: string;
  status?: number;
  used_quota?: number;
  quota?: number;
  created_at?: string;
  updated_at?: string;
  success_rate?: number;
  req_error?: number;
  models?: string;
};

type ChannelTestResult = {
  success?: boolean;
  message?: string;
  model?: string;
  latency?: number;
  instance_id?: number | string;
  instance_name?: string;
  key?: string;
};

type ChannelListData = {
  items: ChannelItem[];
  page: number;
  page_size: number;
  total: number;
};

type ChannelSummary = {
  count: number;
  total_quota: number;
};

type ChannelGroupSummary = {
  tag?: string;
  count?: number;
  key_count?: number;
  submitted?: number;
  added?: number;
  skipped_dup?: number;
  invalid?: number;
  failed?: number;
  enabled?: number;
  used_quota?: number;
  quota?: number;
};

type DisableKeyword = {
  id?: number | string;
  keyword: string;
  status?: string | number | boolean;
};

type UploadSwitch = {
  enabled: boolean;
  uploadable_categories?: string[];
};

type ApiKeyItem = {
  id: number;
  name: string;
  prefix: string;
  scopes: string;
  status: number;
  last_used_at?: string | null;
  created_at?: string;
};

type ModelGap = {
  channel_type?: number;
  gap_rpm: number;
  gap_tpm_est: number;
  model_name: string;
  platform_type?: string;
  platform_type_name: string;
};

type DailyStats = {
  days?: Array<{
    date: string;
    quota?: number;
    total_quota?: number;
    usd?: number;
    channels?: Array<{
      id?: number | string;
      channel_name?: string;
      category?: string;
      quota?: number;
    }>;
  }>;
  start?: string;
  end?: string;
  total_quota?: number;
};

type SubAccount = {
  id: number;
  username: string;
  display_name?: string;
  channel_count?: number;
  used_quota?: number;
  status?: number;
};

type Notice = {
  type: 'ok' | 'warn' | 'error';
  text: string;
};

type Language = 'zh' | 'en';

type TranslationValues = Record<string, string | number>;

const englishTranslations: Record<string, string> = {
  '供应商系统': 'Supplier System',
  '控制台': 'Dashboard',
  '上传密钥': 'Upload Keys',
  '我的渠道': 'My Channels',
  '开放 API': 'Open API',
  '子账号管理': 'Sub-accounts',
  '消费快照': 'Usage Snapshot',
  '模型缺口': 'Model Gaps',
  '打开菜单': 'Open menu',
  '关闭菜单': 'Close menu',
  '语言切换': 'Language switch',
  '修改密码': 'Change Password',
  '退出中...': 'Logging out...',
  '退出登录': 'Log Out',
  '旧密码': 'Current Password',
  '新密码': 'New Password',
  '确认新密码': 'Confirm New Password',
  '取消': 'Cancel',
  '确定': 'Confirm',
  '关闭': 'Close',
  '刷新': 'Refresh',
  '提交': 'Submit',
  '操作': 'Actions',
  '状态': 'Status',
  '分类': 'Category',
  '备注': 'Note',
  '创建时间': 'Created At',
  '新密码至少 6 位。': 'The new password must be at least 6 characters.',
  '两次输入的密码不一致。': 'The two passwords do not match.',
  '修改密码失败，请稍后重试。': 'Unable to change the password. Please try again later.',
  '正在验证登录状态': 'Checking sign-in status',
  '管理员': 'Administrator',
  '供应商': 'Supplier',
  '子账号': 'Sub-account',
  '用户': 'User',
  '启用': 'Enabled',
  '停用': 'Disabled',
  '禁用': 'Disabled',
  '自动禁用': 'Auto-disabled',
  '已删除': 'Deleted',
  '未知': 'Unknown',
  '夜深了': 'Good evening',
  '上午好': 'Good morning',
  '中午好': 'Good afternoon',
  '下午好': 'Good afternoon',
  '晚上好': 'Good evening',
  '欢迎回来': 'Welcome back',
  '暂无': 'N/A',
  '暂无数据': 'No data',
  '暂无记录': 'No records',
  '原站接口当前没有返回记录。': 'The source API returned no records.',
  '正在加载控制台': 'Loading dashboard',
  '累计消耗': 'Total Usage',
  '平均成功率': 'Average Success Rate',
  '启用中': 'Enabled',
  '成功率健康度': 'Success-rate Health',
  '已评估 {{count}} 个': '{{count}} evaluated',
  '优秀 ≥95%': 'Excellent ≥95%',
  '良好 80-95%': 'Good 80-95%',
  '偏低 <80%': 'Low <80%',
  '渠道概况': 'Channel Overview',
  '分类分布': 'Category Distribution',
  '需关注渠道（成功率偏低 / 自动禁用）': 'Channels Needing Attention (low success rate / auto-disabled)',
  '全部': 'All',
  '渠道': 'Channel',
  '标签': 'Tag',
  '成功率': 'Success Rate',
  '近窗口错误': 'Recent Errors',
  '处理': 'Manage',
  '一切正常，没有需要关注的渠道': 'Everything looks good. No channels need attention.',
  '快捷入口': 'Quick Access',
  '上传 API 密钥': 'Upload API Keys',
  '系统维护中，暂停上传。已上传渠道的查询、消费统计不受影响。': 'Uploads are temporarily paused for maintenance. Existing channel queries and usage statistics are unaffected.',
  '选择分类、粘贴密钥、填写标签即可提交。系统自动创建渠道、归入分组并完成上线。各上游实例可单独限制接收的分类；上传页仅隐藏当前无人接收的分类。': 'Choose a category, paste a key, and enter a tag. The system will create the channel, assign it to the group, and bring it online automatically. Categories with no available upstream receiver are hidden.',
  '每次上传请使用全新的标签 / 分组': 'Use a new tag / group for every upload',
  '同一标签只能用于一次上传：若标签已存在，系统会拒绝，避免 key 一直往老批次累加、消费与统计混乱。需要再传一批请换一个新标签名。（同一次批量上传里的多个 key 仍会正常归到该新标签下。）': 'A tag can only be used for one upload. Existing tags are rejected to prevent keys and usage from accumulating in an old batch. Use a new tag for each new batch. Multiple keys in the same upload will still be grouped under that new tag.',
  '批量上传': 'Batch Upload',
  '单个上传': 'Single Upload',
  '渠道分类': 'Channel Category',
  '（可选）': '(optional)',
  '每行一个密钥': 'One key per line',
  '标签 / 分组': 'Tag / Group',
  '输入一个全新的标签名（不可与已有重复），例如：客户A-20260701': 'Enter a new unique tag, for example: client-A-20260701',
  '高级选项（模型范围 · RPM · 号况 · 备注 · 代理，默认全部模型）': 'Advanced options (models, RPM, account status, note, proxy; all models by default)',
  '可用模型范围': 'Available Models',
  '已选 {{selected}}/{{total}}': '{{selected}}/{{total}} selected',
  '该分类暂未返回模型范围，默认使用全部模型。': 'No model range was returned for this category. All models will be used by default.',
  '入库存（备用，暂不上线）': 'Add to standby inventory (not online)',
  '备注（可选）': 'Note (optional)',
  '写一行 = 全部共用；也可一行一个，与密钥逐行对应': 'One line applies to all keys, or enter one line per key',
  '代理 SOCKS5/HTTP（可选）': 'SOCKS5/HTTP Proxy (optional)',
  '入库存': 'Add to Inventory',
  '批量提交': 'Submit Batch',
  '提交密钥': 'Submit Key',
  '密钥列表（一行一个，自动去重）': 'Key List (one per line, automatically deduplicated)',
  '可上传 {{count}} 条': '{{count}} keys ready',
  '请填写该渠道的 API Key。': 'Enter the API key for this channel.',
  '密钥': 'Key',
  '请填写全新的标签 / 分组。': 'Enter a new tag / group.',
  '请输入至少一条密钥。': 'Enter at least one key.',
  '请输入 Base URL。': 'Enter the Base URL.',
  '提交完成：{{success}}/{{total}} 成功。': 'Submitted: {{success}}/{{total}} succeeded.',
  '提交失败': 'Submission failed',
  '成功': 'Success',
  '失败': 'Failed',
  '渠道总数': 'Total Channels',
  '总消耗（全部渠道）': 'Total Usage (all channels)',
  '加载渠道失败': 'Failed to load channels',
  '加载批次明细失败': 'Failed to load batch details',
  '同步用量任务已提交。': 'The usage sync task has been submitted.',
  '同步用量失败': 'Failed to sync usage',
  '加载建议禁用词失败': 'Failed to load suggested keywords',
  '添加禁用词失败': 'Failed to add the keyword',
  '请选择模型': 'Select a model',
  '测试失败': 'Test failed',
  '该渠道没有可测试的模型': 'This channel has no models available for testing',
  '确定启用该渠道？': 'Enable this channel?',
  '确定停用该渠道？': 'Disable this channel?',
  '渠道已启用': 'Channel enabled',
  '渠道已停用': 'Channel disabled',
  '启用渠道失败': 'Failed to enable the channel',
  '停用渠道失败': 'Failed to disable the channel',
  '确定删除？将同步用量并禁用上游渠道，删除后不可恢复。': 'Delete this channel? Usage will be synchronized and the upstream channel will be disabled. This action cannot be undone.',
  '删除成功': 'Deleted successfully',
  '删除渠道失败': 'Failed to delete the channel',
  '同步中...': 'Syncing...',
  '同步用量': 'Sync Usage',
  '建议禁用词': 'Suggest Keywords',
  '分组视图': 'Group View',
  '列表视图': 'List View',
  '筛选:': 'Filter:',
  '创建起': 'Created From',
  '创建止': 'Created To',
  '全部状态': 'All Statuses',
  '全部标签': 'All Tags',
  '搜索 ID / 渠道名 / 备注 / Key': 'Search ID / channel / note / key',
  '正在加载渠道': 'Loading channels',
  '展开': 'Expand',
  '标签 / 分组（批次）': 'Tag / Group (Batch)',
  'Key 数量': 'Key Count',
  '上传去向(最近一次)': 'Upload Result (latest)',
  '启用 / 停用': 'Enabled / Disabled',
  '该批已用额度($)': 'Batch Usage ($)',
  '未分组': 'Ungrouped',
  '提交 {{count}}': 'Submitted {{count}}',
  '新增 {{count}}': 'Added {{count}}',
  '重复 {{count}}': 'Duplicate {{count}}',
  '无效 {{count}}': 'Invalid {{count}}',
  '失败 {{count}}': 'Failed {{count}}',
  '{{count}} 启用': '{{count}} enabled',
  '{{count}} 停用': '{{count}} disabled',
  '在列表中管理': 'Manage in List',
  '正在加载明细': 'Loading details',
  '渠道名称': 'Channel Name',
  '已用额度($)': 'Used Quota ($)',
  '暂无渠道明细。': 'No channel details.',
  '暂无批次': 'No Batches',
  '这个账号当前没有渠道分组数据。': 'This account has no grouped channel data.',
  '已用额度': 'Used Quota',
  '测试': 'Test',
  '删除': 'Delete',
  '暂无渠道': 'No Channels',
  '原站当前返回空列表，上传后会自动显示在这里。': 'The source currently returns an empty list. Uploaded channels will appear here automatically.',
  '共 {{count}} 个批次': '{{count}} batches',
  '共 {{count}} 条': '{{count}} items',
  '上一页': 'Previous page',
  '下一页': 'Next page',
  '向前跳转 5 页': 'Jump back 5 pages',
  '向后跳转 5 页': 'Jump forward 5 pages',
  '每页数量': 'Items per page',
  '{{count}} 条/页': '{{count}} / page',
  '测试渠道 - {{name}}': 'Test Channel - {{name}}',
  '测试方式': 'Test Mode',
  '经 New API（真实链路）': 'Via New API (real route)',
  '直连官方（验证密钥本身）': 'Direct Official Test (verify key)',
  '不经过 New API，直接用渠道原始密钥请求官方，验证密钥本身是否有效，可自定义发送内容。': 'Send the original channel key directly to the official endpoint without New API to verify the key itself. Custom content is supported.',
  '经 New API 用该渠道的 Key 向所选模型发探测请求，反映客户真实可用性（含分组/重定向配置）。': 'Send a probe through New API with this channel key to test real customer availability, including grouping and redirect settings.',
  'AWS Bedrock 直连只验证密钥(AK/SK)本身。真实模型 id 由 New API 转换，直连可能报「模型 id 无效」，但这不代表密钥坏了——已自动按「密钥有效」判定；若显示 403「该账号未开通此模型」则是真不可用，需在 AWS 控制台开通该模型访问后重新上线。测实际可用性请切到「经 New API」。': 'AWS Bedrock direct mode only verifies the AK/SK credentials. New API converts the actual model ID, so a direct test may report an invalid model ID without indicating a bad key. A 403 stating that the model is not enabled is a real failure; enable model access in AWS and bring the channel online again. Use New API mode to test real availability.',
  '自定义发送内容（留空=随机友好语：hi! / 你好~ / ping）': 'Custom content (leave blank for a random greeting: hi! / hello / ping)',
  '选择要测试的模型': 'Select a model to test',
  '测试该模型': 'Test This Model',
  '测试全部模型（{{count}}）': 'Test All Models ({{count}})',
  '测试进度 {{done}}/{{total}}': 'Test progress {{done}}/{{total}}',
  '可用 {{count}}': '{{count}} available',
  '共 {{count}} 项': '{{count}} results',
  '模型': 'Model',
  '实例': 'Instance',
  '结果': 'Result',
  '耗时': 'Latency',
  '信息': 'Information',
  '可用': 'Available',
  '选择模型后点击上方按钮开始测试': 'Select a model, then use the button above to start testing.',
  '建议自动禁用关键词': 'Suggest Auto-disable Keywords',
  '如果你发现某种上游报错代表 key 已经死了（如欠费、被封号），可把报错里的特征片段提交给我们。管理员审核通过后，健康体检命中该片段就会自动下架对应渠道。': 'If an upstream error indicates that a key is dead, such as depleted credit or suspension, submit a distinctive fragment. Once approved, health checks will automatically take matching channels offline.',
  '例如 Your credit balance is too low': 'Example: Your credit balance is too low',
  '正在加载': 'Loading',
  '已生效': 'Approved',
  '待审核': 'Pending',
  '已拒绝': 'Rejected',
  '暂无建议禁用词': 'No suggested keywords',
  '管理 Bearer API Key，并查看原站开放接口说明。': 'Manage Bearer API keys and review the source Open API documentation.',
  'API 密钥': 'API Keys',
  '最近使用：{{date}}': 'Last used: {{date}}',
  '暂无 API Key': 'No API Keys',
  '可以在右侧创建新的开放 API Key。': 'Create a new Open API key on the right.',
  '创建 API Key': 'Create API Key',
  '名称': 'Name',
  '创建密钥': 'Create Key',
  '接口规范': 'API Specification',
  '验证密钥 whoami': 'Verify Key (whoami)',
  '获取分类 meta': 'Get Category Metadata',
  '批量上传 apikey': 'Batch Upload API Keys',
  '分页查询渠道': 'List Channels with Pagination',
  '支持分类与 key 格式': 'Supported Categories and Key Formats',
  '说明': 'Description',
  'key 格式': 'Key Format',
  '错误码': 'Error Codes',
  '复制': 'Copy',
  '区间总消费额度': 'Total Usage Quota',
  '区间总消费(约合美元)': 'Total Usage (USD est.)',
  '日均消费额度': 'Average Daily Usage',
  '每日消费快照': 'Daily Usage Snapshot',
  '开始日期': 'Start date',
  '结束日期': 'End date',
  '刷新今日实时': 'Refresh Today',
  '日期': 'Date',
  '当日消费额度': 'Daily Usage Quota',
  '约合美元': 'USD est.',
  '占比': 'Share',
  '涉及渠道数': 'Channels',
  '正在加载快照': 'Loading snapshots',
  '消费额度': 'Usage Quota',
  '暂无涉及渠道。': 'No channels for this date.',
  '加载每日消费快照失败。': 'Failed to load daily usage snapshots.',
  '加载模型缺口失败': 'Failed to load model gaps',
  '模型缺口提醒': 'Model Gap Alert',
  '已复制缺口通知。': 'Model gap notice copied.',
  '供应缺口提醒来自原站模型缺口接口。': 'Supply gap alerts are loaded from the source model-gap API.',
  '复制通知': 'Copy Notice',
  '正在加载模型缺口': 'Loading model gaps',
  '平台类型': 'Platform Type',
  'RPM 缺口': 'RPM Gap',
  'TPM 估算': 'Estimated TPM',
  '暂无缺口': 'No Gaps',
  '目前没有模型缺口提醒。': 'There are currently no model gap alerts.',
  '当前账号无权限管理子账号': 'This account cannot manage sub-accounts',
  '原站仅供应商主账号可管理子账号；当前登录账号会显示权限结果。': 'Only the primary supplier account can manage sub-accounts. Access is based on the current account.',
  '正在检查权限': 'Checking permissions',
  '用户名': 'Username',
  '显示名': 'Display Name',
  '渠道数': 'Channels',
  '不可管理子账号': 'Sub-account Management Unavailable',
  '原站返回当前账号没有供应商主账号权限。': 'The source reports that this account does not have primary supplier permissions.',
  '新 API Key': 'New API Key',
  '加载 API Key 失败': 'Failed to load API keys',
  '创建成功：{{key}}': 'Created successfully: {{key}}',
  '创建成功，明文仅会显示一次。': 'Created successfully. The plaintext key is shown only once.',
  '创建失败': 'Creation failed',
  '查询渠道': 'Read Channels',
  '读取分类': 'Read Categories',
  '请求参数错误 / 分类不支持 / tag 重复': 'Invalid parameters / unsupported category / duplicate tag',
  'API Key 缺失、无效或停用': 'API key is missing, invalid, or disabled',
  '当前 Key 缺少所需权限 scope': 'This key does not have the required scope',
  '资源不存在': 'Resource not found',
  '服务端错误': 'Server error',
  'Claude 官方': 'Claude Official',
  'GPT 官方': 'GPT Official',
  '展开 {{date}} 的渠道明细': 'Expand channel details for {{date}}',
};

type LanguageContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (text: string, values?: TranslationValues) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('zh');

  useEffect(() => {
    try {
      const storedLanguage = window.localStorage.getItem('supplier.lang') === 'en' ? 'en' : 'zh';
      setLanguageState(storedLanguage);
      document.documentElement.lang = storedLanguage === 'en' ? 'en' : 'zh-CN';
    } catch {
      // Language persistence is optional.
    }
  }, []);

  const setLanguage = useCallback((nextLanguage: Language) => {
    setLanguageState(nextLanguage);
    document.documentElement.lang = nextLanguage === 'en' ? 'en' : 'zh-CN';
    try {
      window.localStorage.setItem('supplier.lang', nextLanguage);
    } catch {
      // Language persistence is optional.
    }
  }, []);

  const t = useCallback(
    (text: string, values: TranslationValues = {}) => {
      const template = language === 'en' ? englishTranslations[text] || text : text;
      return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => String(values[key] ?? ''));
    },
    [language],
  );

  const value = useMemo(() => ({ language, setLanguage, t }), [language, setLanguage, t]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

function useLanguage() {
  const value = useContext(LanguageContext);
  if (!value) throw new Error('useLanguage must be used inside LanguageProvider');
  return value;
}

type ViewKey =
  | 'dashboard'
  | 'upload'
  | 'my-channels'
  | 'api-access'
  | 'sub-accounts'
  | 'daily-stats'
  | 'model-gaps';

const categoryLabels: Record<string, string> = {
  aws: 'AWS Bedrock',
  aws_a: 'Claude on AWS',
  anthropic: 'Anthropic 官方',
  anthropic_small: 'Anthropic 小额',
  anthropic_test: 'Anthropic 测试小额',
  anthropic_ent: 'Anthropic 参数覆盖',
  openai: 'OpenAI',
  azure: 'Azure OpenAI',
  azure_claude: 'Azure Claude',
  ai_studio: 'Google AI Studio',
  vertexai: 'Vertex AI Gemini',
  vertexai_claude: 'Vertex AI Claude',
  openrouter: 'OpenRouter',
  ocrarouter: 'Ocrarouter Claude',
  opencode: 'OpenCode Claude',
  cloudflare: 'Cloudflare Claude',
};

const categoryLabelsEn: Record<string, string> = {
  aws: 'AWS Bedrock',
  aws_a: 'Claude on AWS',
  anthropic: 'Anthropic Official',
  anthropic_small: 'Anthropic Small',
  anthropic_test: 'Anthropic Test Small',
  anthropic_ent: 'Anthropic Parameter Override',
  openai: 'OpenAI',
  azure: 'Azure OpenAI',
  azure_claude: 'Azure Claude',
  ai_studio: 'Google AI Studio',
  vertexai: 'Vertex AI Gemini',
  vertexai_claude: 'Vertex AI Claude',
  openrouter: 'OpenRouter',
  ocrarouter: 'Ocrarouter Claude',
  opencode: 'OpenCode Claude',
  cloudflare: 'Cloudflare Claude',
};

function categoryLabel(category: string, language: Language) {
  return (language === 'en' ? categoryLabelsEn : categoryLabels)[category] || category;
}

const keyFormatHints: Record<string, string> = {
  aws: 'AccessKeyID|SecretAccessKey',
  aws_a: '单个 API Key + base_url',
  anthropic: 'sk-ant-...',
  anthropic_small: 'sk-ant-...',
  anthropic_test: 'sk-ant-...',
  anthropic_ent: 'sk-ant-oat01-...',
  openai: 'sk-...',
  azure: 'Resource|ApiKey|ApiVersion',
  azure_claude: 'Resource|ApiKey|ApiVersion',
  ai_studio: '单个 API Key',
  vertexai: 'GCP 服务账号 JSON 或 Vertex API Key',
  vertexai_claude: 'GCP 服务账号 JSON 或 Vertex API Key',
  openrouter: 'sk-or-...',
  opencode: '单个 API Key',
  cloudflare: '单个 API Key',
};

const keyFormatHintsEn: Record<string, string> = {
  aws: 'AccessKeyID|SecretAccessKey',
  aws_a: 'Single API key + base_url',
  anthropic: 'sk-ant-...',
  anthropic_small: 'sk-ant-...',
  anthropic_test: 'sk-ant-...',
  anthropic_ent: 'sk-ant-oat01-...',
  openai: 'sk-...',
  azure: 'Resource|ApiKey|ApiVersion',
  azure_claude: 'Resource|ApiKey|ApiVersion',
  ai_studio: 'Single API key',
  vertexai: 'GCP service-account JSON or Vertex API key',
  vertexai_claude: 'GCP service-account JSON or Vertex API key',
  openrouter: 'sk-or-...',
  opencode: 'Single API key',
  cloudflare: 'Single API key',
};

const singleUploadHints: Record<string, string> = {
  aws: 'Key 格式：AccessKey|SecretKey（AK/SK 模式，Region 可省略，系统自动探测）；或直接填一个 Bedrock API Key（API Key 模式，不带 |）。两种可混传，无需 Base URL',
  aws_a: 'AWS Claude 新版：填写 API Key 与 Base URL；Base URL 必须为 https://<租户>.api.aws，请勿填写占位地址。',
  anthropic: '只需填写 API Key（sk-ant-...），无需 Base URL。',
  anthropic_small: '填写小额官方 Key（sk-ant-...），无需 Base URL，请勿与普通 Anthropic Key 混用。',
  anthropic_test: '填写测试小额官方 Key（sk-ant-...），无需 Base URL，请与官方及小额分类分开上传。',
  anthropic_ent: '填写 Anthropic 参数覆盖 Key（sk-ant-oat01-...），无需 Base URL。',
  openai: '只需填写 API Key（sk-...），使用官方接口，无需 Base URL。',
  azure: '格式：Resource|ApiKey|ApiVersion，系统将自动拼接 https://{resource}.openai.azure.com。',
  azure_claude: 'Azure Claude 格式：Resource|ApiKey|ApiVersion，系统将自动拼接服务地址。',
  ai_studio: '只需填写 Gemini API Key（AIza...），使用 Google AI Studio 官方接口，无需 Base URL。',
  vertexai: '填写 GCP 服务账号 JSON 或 Vertex API Key，无需 Base URL。',
  vertexai_claude: '填写 GCP 服务账号 JSON 或 Vertex API Key，无需 Base URL。',
  openrouter: '填写 OpenRouter API Key（sk-or-v1-...），使用官方接口，无需 Base URL。',
  ocrarouter: '填写 Ocrarouter API Key，使用官方接口，无需 Base URL。',
  opencode: '填写 OpenCode API Key，使用官方接口，无需 Base URL。',
  cloudflare: '格式：API-Token|AccountID，使用 Cloudflare 官方接口，无需 Base URL。',
};

const singleUploadHintsEn: Record<string, string> = {
  aws: 'Key format: AccessKey|SecretKey (AK/SK; Region optional and auto-detected), or a single Bedrock API key without |. Both formats may be mixed. No Base URL is required.',
  aws_a: 'AWS Claude new: enter an API key and Base URL. The Base URL must be https://<tenant>.api.aws and cannot be a placeholder.',
  anthropic: 'Enter an API key (sk-ant-...). No Base URL is required.',
  anthropic_small: 'Enter a small official key (sk-ant-...). Do not mix it with regular Anthropic keys.',
  anthropic_test: 'Enter a test-small official key (sk-ant-...) and upload it separately from official and small categories.',
  anthropic_ent: 'Enter an Anthropic parameter-override key (sk-ant-oat01-...). No Base URL is required.',
  openai: 'Enter an API key (sk-...) for the official endpoint. No Base URL is required.',
  azure: 'Format: Resource|ApiKey|ApiVersion. The endpoint https://{resource}.openai.azure.com is generated automatically.',
  azure_claude: 'Azure Claude format: Resource|ApiKey|ApiVersion. The service endpoint is generated automatically.',
  ai_studio: 'Enter a Gemini API key (AIza...) for the official Google AI Studio endpoint.',
  vertexai: 'Enter a GCP service-account JSON or Vertex API key. No Base URL is required.',
  vertexai_claude: 'Enter a GCP service-account JSON or Vertex API key. No Base URL is required.',
  openrouter: 'Enter an OpenRouter API key (sk-or-v1-...) for the official endpoint.',
  ocrarouter: 'Enter an Ocrarouter API key for the official endpoint.',
  opencode: 'Enter an OpenCode API key for the official endpoint.',
  cloudflare: 'Format: API-Token|AccountID for the official Cloudflare endpoint.',
};

const uploadCategoryCards = [
  { key: 'aws', name: 'AWS', provider: 'Amazon Bedrock', color: '#ff9900', categories: ['aws', 'aws_a'] },
  { key: 'anthropic', name: 'Anthropic', provider: 'Claude 官方', color: '#d97757', categories: ['anthropic', 'anthropic_small', 'anthropic_test', 'anthropic_ent'] },
  { key: 'openai', name: 'OpenAI', provider: 'GPT 官方', color: '#10a37f', categories: ['openai'] },
  { key: 'azure', name: 'Azure', provider: 'Microsoft Azure', color: '#0078d4', categories: ['azure', 'azure_claude'] },
  { key: 'google', name: 'Google', provider: 'Gemini / Vertex', color: '#4285f4', categories: ['ai_studio', 'vertexai', 'vertexai_claude'] },
  { key: 'openrouter', name: 'OpenRouter', provider: 'OpenRouter Claude', color: '#6467f2', categories: ['openrouter'] },
  { key: 'opencode', name: 'OpenCode', provider: 'OpenCode Claude', color: '#111827', categories: ['opencode'] },
  { key: 'cloudflare', name: 'Cloudflare', provider: 'Cloudflare Claude', color: '#f6821f', categories: ['cloudflare'] },
] as const;

const uploadCategoryVariants: Record<string, string> = {
  aws: 'Bedrock 密钥',
  aws_a: 'Claude 代理 (api.aws) · 新版',
  anthropic: '官方 API',
  anthropic_small: '小额官方',
  anthropic_test: '测试小额',
  anthropic_ent: '参数覆盖',
  openai: '官方 API',
  azure: 'Azure OpenAI · GPT',
  azure_claude: 'Azure · Claude',
  ai_studio: 'AI Studio · Gemini',
  vertexai: 'Vertex AI · Gemini',
  vertexai_claude: 'Vertex AI · Claude',
  openrouter: 'OpenRouter · Claude',
  opencode: 'OpenCode Claude',
  cloudflare: 'Cloudflare Claude',
};

const uploadCategoryVariantsEn: Record<string, string> = {
  aws: 'Bedrock Key',
  aws_a: 'Claude Proxy (api.aws) · New',
  anthropic: 'Official API',
  anthropic_small: 'Small Official',
  anthropic_test: 'Test Small',
  anthropic_ent: 'Parameter Override',
  openai: 'Official API',
  azure: 'Azure OpenAI · GPT',
  azure_claude: 'Azure · Claude',
  ai_studio: 'AI Studio · Gemini',
  vertexai: 'Vertex AI · Gemini',
  vertexai_claude: 'Vertex AI · Claude',
  openrouter: 'OpenRouter · Claude',
  ocrarouter: 'Ocrarouter · Claude',
  opencode: 'OpenCode Claude',
  cloudflare: 'Cloudflare Claude',
};

const scopeOptions = [
  { value: 'channels:write', label: '上传密钥' },
  { value: 'channels:read', label: '查询渠道' },
  { value: 'meta:read', label: '读取分类' },
];

const navItems: Array<{
  key: ViewKey;
  label: string;
  icon: ComponentType<{ size?: number; strokeWidth?: number }>;
}> = [
  { key: 'dashboard', label: '控制台', icon: Gauge },
  { key: 'upload', label: '上传密钥', icon: UploadCloud },
  { key: 'my-channels', label: '我的渠道', icon: FileKey2 },
  { key: 'api-access', label: '开放 API', icon: BookOpen },
  { key: 'sub-accounts', label: '子账号管理', icon: Users },
  { key: 'daily-stats', label: '消费快照', icon: BarChart3 },
  { key: 'model-gaps', label: '模型缺口', icon: Zap },
];

const subAccountNavItems = ['dashboard', 'upload', 'my-channels', 'model-gaps', 'daily-stats'].map(
  (key) => navItems.find((item) => item.key === key)!,
);

const openApiErrors = [
  ['0', '成功'],
  ['40001', '请求参数错误 / 分类不支持 / tag 重复'],
  ['40101', 'API Key 缺失、无效或停用'],
  ['40301', '当前 Key 缺少所需权限 scope'],
  ['40401', '资源不存在'],
  ['50001', '服务端错误'],
];

const API_CACHE_TTL = 12_000;
const apiCache = new Map<string, { expiresAt: number; value: unknown }>();
const pendingApiRequests = new Map<string, Promise<unknown>>();
const USER_CACHE_KEY = 'gys:profile';
const AUTH_MESSAGE_KEY = 'gys:auth-message';
let authRedirectPending = false;

const apiCodeMessages: Record<number, string> = {
  40001: '请求参数错误',
  40101: 'API Key 缺失、无效或已停用',
  40301: '当前 Key 缺少所需权限',
  40401: '资源不存在',
  50001: '服务器内部错误',
};

const apiCodeStatuses: Record<number, number> = {
  0: 200,
  40001: 400,
  40101: 401,
  40301: 403,
  40401: 404,
  50001: 500,
};

class ApiRequestError extends Error {
  code?: number;
  status: number;
  requestId?: string;

  constructor(message: string, status: number, code?: number, requestId?: string) {
    super(message);
    this.name = 'ApiRequestError';
    this.status = status;
    this.code = code;
    this.requestId = requestId;
  }
}

function normalizeApiCode(code: ApiEnvelope<unknown>['code']) {
  if (typeof code === 'number' && Number.isFinite(code)) return code;
  if (typeof code === 'string' && code.trim()) {
    const parsed = Number(code);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function getApiErrorMessage(payload: ApiEnvelope<unknown>, status: number, code?: number) {
  const message = typeof payload.message === 'string' ? payload.message.trim() : '';
  if (message) return message;
  if (code && apiCodeMessages[code]) return apiCodeMessages[code];
  if (status === 401) return '登录状态已失效，请重新登录';
  if (status === 403) return '当前账号没有操作权限';
  if (status === 404) return '请求的资源不存在';
  if (status >= 500) return '服务器内部错误';
  return `请求失败：${status}`;
}

function redirectToLogin(path: string, message: string) {
  if (typeof window === 'undefined' || path.startsWith('/api/auth/login')) return;

  clearCachedUser();
  apiCache.clear();

  if (window.location.pathname === '/login') return;

  try {
    sessionStorage.setItem(AUTH_MESSAGE_KEY, message);
  } catch {
    // The redirect still works when browser storage is unavailable.
  }

  authRedirectPending = true;
  window.location.replace('/login');
}

function takeAuthMessage() {
  if (typeof window === 'undefined') return '';

  try {
    const message = sessionStorage.getItem(AUTH_MESSAGE_KEY) || '';
    sessionStorage.removeItem(AUTH_MESSAGE_KEY);
    return message;
  } catch {
    return '';
  }
}

function roleLabel(role?: string, language: Language = 'zh') {
  if (role === 'admin') return language === 'en' ? 'Administrator' : '管理员';
  if (role === 'supplier') return language === 'en' ? 'Supplier' : '供应商';
  if (role === 'sub') return language === 'en' ? 'Sub-account' : '子账号';
  return role || (language === 'en' ? 'User' : '用户');
}

function statusLabel(status?: number, language: Language = 'zh') {
  if (status === 1) return language === 'en' ? 'Enabled' : '启用';
  if (status === 2) return language === 'en' ? 'Disabled' : '禁用';
  if (status === 3) return language === 'en' ? 'Auto-disabled' : '自动禁用';
  if (status === 0) return language === 'en' ? 'Deleted' : '已删除';
  return language === 'en' ? 'Unknown' : '未知';
}

type PaginationItem = number | 'backward' | 'forward';

function createPaginationItems(currentPage: number, pageCount: number): PaginationItem[] {
  if (pageCount <= 7) {
    return Array.from({ length: pageCount }, (_, index) => index + 1);
  }

  const buffer = 2;
  let left = Math.max(1, currentPage - buffer);
  let right = Math.min(pageCount, currentPage + buffer);

  if (currentPage <= buffer + 2) {
    left = 1;
    right = 1 + buffer * 2;
  } else if (currentPage >= pageCount - buffer - 1) {
    left = pageCount - buffer * 2;
    right = pageCount;
  }

  const items: PaginationItem[] = [];
  if (left > 1) {
    items.push(1);
    if (left > 2) items.push('backward');
  }

  for (let page = left; page <= right; page += 1) {
    items.push(page);
  }

  if (right < pageCount) {
    if (right < pageCount - 1) items.push('forward');
    items.push(pageCount);
  }

  return items;
}

function formatQuota(value?: number, digits = 4) {
  return `$${((value || 0) / 500000).toFixed(digits)}`;
}

function formatInteger(value?: number) {
  return Number(value || 0).toLocaleString('zh-CN');
}

function formatDate(value?: string | null, language: Language = 'zh') {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString(language === 'en' ? 'en-US' : 'zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function viewFromPath(pathname: string): ViewKey {
  const key = pathname.replace(/^\/+/, '').split('/')[0] as ViewKey;
  return navItems.some((item) => item.key === key) ? key : 'dashboard';
}

function greeting(language: Language = 'zh') {
  const hour = new Date().getHours();
  if (language === 'en') {
    if (hour < 6) return 'Good evening';
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  }
  if (hour < 6) return '夜深了';
  if (hour < 12) return '上午好';
  if (hour < 14) return '中午好';
  if (hour < 18) return '下午好';
  return '晚上好';
}

function readCachedUser(): UserProfile | null {
  if (typeof window === 'undefined') return null;

  try {
    const value = sessionStorage.getItem(USER_CACHE_KEY);
    return value ? (JSON.parse(value) as UserProfile) : null;
  } catch {
    return null;
  }
}

function cacheUser(user: UserProfile) {
  if (typeof window === 'undefined') return;

  try {
    sessionStorage.setItem(USER_CACHE_KEY, JSON.stringify(user));
  } catch {
    // Storage can be unavailable in private browsing modes.
  }
}

function clearCachedUser() {
  if (typeof window === 'undefined') return;

  try {
    sessionStorage.removeItem(USER_CACHE_KEY);
  } catch {
    // Nothing else is needed when browser storage is unavailable.
  }
}

async function api<T>(path: string, init: ApiRequestInit = {}): Promise<T> {
  const { fresh = false, ...requestInit } = init;
  const method = (requestInit.method || 'GET').toUpperCase();
  const cacheKey = `${method}:${path}`;
  const cacheable = method === 'GET';
  const cached = cacheable && !fresh ? apiCache.get(cacheKey) : undefined;

  if (cached && cached.expiresAt > Date.now()) {
    return cached.value as T;
  }

  if (cacheable && !fresh) {
    const pending = pendingApiRequests.get(cacheKey);
    if (pending) return pending as Promise<T>;
  }

  const request = (async () => {
    const headers = new Headers(requestInit.headers);
    let body = requestInit.body;

    if (
      body &&
      typeof body !== 'string' &&
      !(body instanceof FormData) &&
      !(body instanceof URLSearchParams) &&
      !(body instanceof Blob)
    ) {
      headers.set('content-type', 'application/json');
      body = JSON.stringify(body);
    }

    const response = await fetch(path, {
      ...requestInit,
      body,
      headers,
      credentials: 'include',
      cache: 'no-store',
    });
    const contentType = response.headers.get('content-type') || '';
    let payload: ApiEnvelope<T>;

    if (contentType.includes('application/json')) {
      try {
        const parsed = await response.json();
        payload = parsed && typeof parsed === 'object'
          ? (parsed as ApiEnvelope<T>)
          : ({ data: parsed as T, success: response.ok } as ApiEnvelope<T>);
      } catch {
        payload = { success: response.ok };
      }
    } else {
      payload = { data: (await response.text()) as T, success: response.ok };
    }

    const code = normalizeApiCode(payload.code);
    const status = code === undefined ? response.status : (apiCodeStatuses[code] ?? response.status);
    const message = getApiErrorMessage(payload, status, code);
    const unauthorized = status === 401;

    if (unauthorized) {
      redirectToLogin(path, message);
      throw new ApiRequestError(message, status, code, payload.request_id);
    }

    if (
      !response.ok ||
      payload.success === false ||
      (code !== undefined && code !== 0)
    ) {
      throw new ApiRequestError(message, status, code, payload.request_id);
    }

    let data = (payload.data ?? payload) as T;
    if (
      code === 0 &&
      payload.data !== undefined &&
      data &&
      typeof data === 'object' &&
      !Array.isArray(data)
    ) {
      const objectData = data as Record<string, unknown>;
      data = {
        ...objectData,
        message: objectData.message ?? payload.message,
        request_id: objectData.request_id ?? payload.request_id,
      } as T;
    }
    if (cacheable) {
      apiCache.set(cacheKey, { expiresAt: Date.now() + API_CACHE_TTL, value: data });
    } else {
      apiCache.clear();
    }
    return data;
  })();

  if (cacheable && !fresh) {
    pendingApiRequests.set(cacheKey, request);
  }

  try {
    return await request;
  } finally {
    pendingApiRequests.delete(cacheKey);
  }
}

function Badge({
  tone = 'neutral',
  children,
}: {
  tone?: 'neutral' | 'green' | 'blue' | 'orange' | 'red' | 'purple';
  children: ReactNode;
}) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}

function EmptyState({
  title,
  description,
}: {
  title?: string;
  description?: string;
}) {
  const { t } = useLanguage();

  return (
    <div className="empty-state">
      <Database size={28} />
      <strong>{t(title || '暂无数据')}</strong>
      <span>{t(description || '原站接口当前没有返回记录。')}</span>
    </div>
  );
}

function NoticeBanner({ notice }: { notice: Notice | null }) {
  if (!notice) return null;
  return (
    <div className={`notice notice-${notice.type}`}>
      {notice.type === 'ok' ? (
        <CheckCircle2 size={18} />
      ) : (
        <AlertTriangle size={18} />
      )}
      <span>{notice.text}</span>
    </div>
  );
}

function LoginScreen({ onLogin }: { onLogin: (user: UserProfile) => void }) {
  const { language, setLanguage } = useLanguage();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);

  const copy =
    language === 'zh'
      ? {
          title: '供应商管理系统',
          username: '用户名',
          password: '密码',
          usernameRequired: '请输入用户名',
          passwordRequired: '请输入密码',
          submit: '登 录',
          failed: '登录失败',
          showPassword: '显示密码',
          hidePassword: '隐藏密码',
        }
      : {
          title: 'Supplier Management System',
          username: 'Username',
          password: 'Password',
          usernameRequired: 'Please enter your username',
          passwordRequired: 'Please enter your password',
          submit: 'Log in',
          failed: 'Login failed',
          showPassword: 'Show password',
          hidePassword: 'Hide password',
        };

  useEffect(() => {
    const authMessage = takeAuthMessage();
    if (authMessage) setNotice({ type: 'error', text: authMessage });
  }, []);

  useEffect(() => {
    if (!notice) return;

    const timeout = window.setTimeout(() => setNotice(null), 4_000);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const nextErrors = {
      username: username.trim() ? '' : copy.usernameRequired,
      password: password ? '' : copy.passwordRequired,
    };
    setFieldErrors(nextErrors);
    if (nextErrors.username || nextErrors.password) return;

    setLoading(true);
    setNotice(null);
    try {
      const user = await api<UserProfile>('/api/auth/login', {
        method: 'POST',
        body: { username, password },
      });
      onLogin(user);
    } catch (error) {
      setNotice({
        type: 'error',
        text: error instanceof Error ? error.message : copy.failed,
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-shell">
      {notice && (
        <div className="login-toast" role="alert">
          <XCircle size={16} />
          <span>{notice.text}</span>
        </div>
      )}
      <section className="login-card">
        <div className="login-language-row">
          <div className="login-language-switch" aria-label="Language" role="group">
            <button
              aria-pressed={language === 'zh'}
              className={language === 'zh' ? 'active' : ''}
              onClick={() => setLanguage('zh')}
              type="button"
            >
              中文
            </button>
            <button
              aria-pressed={language === 'en'}
              className={language === 'en' ? 'active' : ''}
              onClick={() => setLanguage('en')}
              type="button"
            >
              English
            </button>
          </div>
        </div>
        <h1>{copy.title}</h1>
        <form onSubmit={submit} className="login-form" noValidate>
          <div className="login-form-item">
            <div className={fieldErrors.username ? 'login-input login-input-error' : 'login-input'}>
              <User size={17} />
              <input
                aria-invalid={Boolean(fieldErrors.username)}
                aria-label={copy.username}
                value={username}
                onChange={(event) => {
                  setUsername(event.target.value);
                  if (fieldErrors.username) setFieldErrors((current) => ({ ...current, username: '' }));
                }}
                placeholder={copy.username}
                autoComplete="username"
              />
            </div>
            {fieldErrors.username && <span className="login-field-error">{fieldErrors.username}</span>}
          </div>
          <div className="login-form-item">
            <div className={fieldErrors.password ? 'login-input login-input-error' : 'login-input'}>
              <LockKeyhole size={17} />
              <input
                aria-invalid={Boolean(fieldErrors.password)}
                aria-label={copy.password}
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  if (fieldErrors.password) setFieldErrors((current) => ({ ...current, password: '' }));
                }}
                placeholder={copy.password}
                autoComplete="current-password"
                type={showPassword ? 'text' : 'password'}
              />
              <button
                aria-label={showPassword ? copy.hidePassword : copy.showPassword}
                className="login-password-toggle"
                onClick={() => setShowPassword((current) => !current)}
                onMouseDown={(event) => event.preventDefault()}
                type="button"
              >
                {showPassword ? <Eye size={15} /> : <EyeOff size={15} />}
              </button>
            </div>
            {fieldErrors.password && <span className="login-field-error">{fieldErrors.password}</span>}
          </div>
          <button className="login-submit-button" disabled={loading} type="submit">
            {loading && <Loader2 className="spin" size={17} />}
            {copy.submit}
          </button>
        </form>
      </section>
    </main>
  );
}

function Shell({
  user,
  activeView,
  setActiveView,
  onLogout,
  isLoggingOut,
  children,
}: {
  user: UserProfile;
  activeView: ViewKey;
  setActiveView: (view: ViewKey) => void;
  onLogout: () => void;
  isLoggingOut: boolean;
  children: ReactNode;
}) {
  const { language, setLanguage, t } = useLanguage();
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement>(null);
  const visibleNavItems = user.role === 'sub' ? subAccountNavItems : navItems;

  useEffect(() => {
    if (!accountMenuOpen) return;

    function closeMenu(event: MouseEvent) {
      if (!accountMenuRef.current?.contains(event.target as Node)) {
        setAccountMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', closeMenu);
    return () => document.removeEventListener('mousedown', closeMenu);
  }, [accountMenuOpen]);

  function navigate(view: ViewKey) {
    setActiveView(view);
    setMenuOpen(false);
    window.history.pushState({}, '', `/${view}`);
  }

  function openPasswordDialog() {
    setAccountMenuOpen(false);
    setPasswordError('');
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordDialogOpen(true);
  }

  async function changePassword(event: FormEvent) {
    event.preventDefault();
    setPasswordError('');

    if (newPassword.length < 6) {
      setPasswordError(t('新密码至少 6 位。'));
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError(t('两次输入的密码不一致。'));
      return;
    }

    setChangingPassword(true);
    try {
      await api('/api/auth/password', {
        method: 'POST',
        body: { old_password: oldPassword, new_password: newPassword },
      });
      setPasswordDialogOpen(false);
      window.setTimeout(onLogout, 800);
    } catch (error) {
      setPasswordError(error instanceof Error ? error.message : t('修改密码失败，请稍后重试。'));
    } finally {
      setChangingPassword(false);
    }
  }

  return (
    <main className="app-shell">
      <aside className={`sidebar ${menuOpen ? 'sidebar-open' : ''}`}>
        <div className="brand">
          <strong>{t('供应商系统')}</strong>
        </div>
        <nav>
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.key}
                className={activeView === item.key ? 'active' : ''}
                onClick={() => navigate(item.key)}
                type="button"
              >
                <Icon size={18} />
                <span>{t(item.label)}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      <section className="content-shell">
        <header className="topbar">
          <button
            className="icon-button mobile-only"
            onClick={() => setMenuOpen(true)}
            aria-label={t('打开菜单')}
            type="button"
          >
            <Menu size={20} />
          </button>
          <div className="topbar-spacer" />
          <div className="topbar-tools">
            <div className="language-switch" aria-label={t('语言切换')}>
              <button
                className={language === 'zh' ? 'active' : ''}
                onClick={() => setLanguage('zh')}
                type="button"
              >
                中文
              </button>
              <button
                className={language === 'en' ? 'active' : ''}
                onClick={() => setLanguage('en')}
                type="button"
              >
                English
              </button>
            </div>
            <div className="account-menu" ref={accountMenuRef}>
              <button
                className="account-trigger"
                aria-expanded={accountMenuOpen}
                aria-haspopup="menu"
                onClick={() => setAccountMenuOpen((open) => !open)}
                type="button"
              >
                <span className="account-avatar" aria-hidden="true">
                  <User size={18} />
                </span>
                <span>{user.display_name || user.username}</span>
              </button>
              {accountMenuOpen && (
                <div className="account-dropdown" role="menu">
                  <button onClick={openPasswordDialog} role="menuitem" type="button">
                    <LockKeyhole size={16} />
                    <span>{t('修改密码')}</span>
                  </button>
                  <div className="account-menu-divider" />
                  <button
                    disabled={isLoggingOut}
                    onClick={onLogout}
                    role="menuitem"
                    type="button"
                  >
                    {isLoggingOut ? <Loader2 className="spin" size={16} /> : <LogOut size={16} />}
                    <span>{isLoggingOut ? t('退出中...') : t('退出登录')}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>
        <div className="page-pad">{children}</div>
      </section>

      {menuOpen && (
        <button
          className="scrim"
          onClick={() => setMenuOpen(false)}
          aria-label={t('关闭菜单')}
          type="button"
        >
          <X size={22} />
        </button>
      )}

      {passwordDialogOpen && (
        <div className="dialog-backdrop" role="presentation">
          <section
            aria-labelledby="change-password-title"
            aria-modal="true"
            className="account-dialog"
            role="dialog"
          >
            <div className="account-dialog-header">
              <h2 id="change-password-title">{t('修改密码')}</h2>
              <button aria-label={t('关闭')} onClick={() => setPasswordDialogOpen(false)} type="button">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={changePassword}>
              <label>
                <span>{t('旧密码')}</span>
                <input
                  autoComplete="current-password"
                  onChange={(event) => setOldPassword(event.target.value)}
                  required
                  type="password"
                  value={oldPassword}
                />
              </label>
              <label>
                <span>{t('新密码')}</span>
                <input
                  autoComplete="new-password"
                  onChange={(event) => setNewPassword(event.target.value)}
                  required
                  type="password"
                  value={newPassword}
                />
              </label>
              <label>
                <span>{t('确认新密码')}</span>
                <input
                  autoComplete="new-password"
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  required
                  type="password"
                  value={confirmPassword}
                />
              </label>
              {passwordError && <p className="account-dialog-error">{passwordError}</p>}
              <div className="account-dialog-actions">
                <button
                  className="ghost-button"
                  disabled={changingPassword}
                  onClick={() => setPasswordDialogOpen(false)}
                  type="button"
                >
                  {t('取消')}
                </button>
                <button className="primary-button compact" disabled={changingPassword} type="submit">
                  {changingPassword && <Loader2 className="spin" size={16} />}
                  {t('确定')}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}

function DashboardView({ setView }: { setView: (view: ViewKey) => void }) {
  const { language, t } = useLanguage();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<Notice | null>(null);
  const channels = data?.channels || {};
  const role = data?.role;
  const healthRate = channels.avg_sr;
  const healthPercent = healthRate == null || healthRate < 0
    ? 0
    : Math.min(100, Math.round(healthRate * 1000) / 10);
  const healthColor = dashboardHealthColor(healthRate);
  const notScored = Math.max(0, (channels.total || 0) - (channels.scored || 0));
  const shortcuts: Array<{
    color: string;
    icon: ComponentType<{ size?: number }>;
    label: string;
    view: ViewKey;
  }> = [
    { icon: UploadCloud, label: '上传密钥', view: 'upload', color: '#1677ff' },
    { icon: FileKey2, label: '我的渠道', view: 'my-channels', color: '#13c2c2' },
    ...(role === 'supplier'
      ? [{ icon: Users, label: '子账号管理', view: 'sub-accounts' as ViewKey, color: '#722ed1' }]
      : []),
    { icon: BarChart3, label: '消费快照', view: 'daily-stats', color: '#fa8c16' },
  ];

  async function load(fresh = false) {
    setLoading(true);
    setNotice(null);
    try {
      setData(await api<DashboardData>('/api/dashboard', { fresh }));
    } catch (error) {
      setData(null);
      setNotice({
        type: 'error',
        text: error instanceof Error ? error.message : t('加载控制台失败'),
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <section className="dashboard-page">
      <NoticeBanner notice={notice} />
      <div className="dashboard-hero">
        <div>
          <h1>
            {data
              ? `${greeting(language)}${language === 'en' ? ', ' : '，'}${data.display_name || t('欢迎回来')}`
              : t('欢迎回来')}
          </h1>
          <p>
            {data
              ? `${roleLabel(role, language)} ${t('控制台')} · ${new Date().toLocaleDateString(language === 'en' ? 'en-US' : 'zh-CN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                weekday: 'long',
              })}`
              : t('正在加载控制台')}
          </p>
        </div>
        <button className="dashboard-hero-button" onClick={() => setView('upload')} type="button">
          <UploadCloud size={16} />
          {t('上传密钥')}
        </button>
      </div>

      {loading ? (
        <div className="dashboard-skeleton" aria-label={t('正在加载控制台')}>
          {Array.from({ length: 8 }, (_, index) => <span key={index} />)}
        </div>
      ) : (
        <>
          <div className="dashboard-stat-grid">
            <StatCard
              icon={FileKey2}
              label={t('我的渠道')}
              value={formatInteger(channels.total)}
              color="#1677ff"
              onClick={() => setView('my-channels')}
            />
            <StatCard
              icon={CircleDollarSign}
              label={t('累计消耗')}
              value={formatQuota(channels.quota_used, 2)}
              color="#13c2c2"
            />
            <StatCard
              icon={ShieldCheck}
              label={t('平均成功率')}
              value={channels.avg_sr == null ? t('暂无') : `${(channels.avg_sr * 100).toFixed(1)}%`}
              color={healthColor}
            />
            <StatCard
              icon={Zap}
              label={t('启用中')}
              value={formatInteger(channels.enabled)}
              color="#52c41a"
            />
          </div>

          <div className="dashboard-overview-grid">
            <article className="dashboard-card dashboard-health-card">
              <header className="dashboard-card-header">
                <h2>{t('成功率健康度')}</h2>
                <span>{t('已评估 {{count}} 个', { count: formatInteger(channels.scored) })}</span>
              </header>
              <div className="dashboard-card-body dashboard-health-body">
                <div
                  className="dashboard-health-gauge"
                  style={{
                    '--dashboard-health-color': healthColor,
                    '--dashboard-health-sweep': `${healthPercent * 0.75}%`,
                  } as CSSProperties}
                >
                  <span>{healthRate == null || healthRate < 0 ? t('暂无数据') : `${healthPercent}%`}</span>
                </div>
                <div className="dashboard-health-rows">
                  <HealthBar color="#52c41a" count={channels.good || 0} label={t('优秀 ≥95%')} total={channels.scored || 0} />
                  <HealthBar color="#faad14" count={channels.warn || 0} label={t('良好 80-95%')} total={channels.scored || 0} />
                  <HealthBar color="#ff4d4f" count={channels.bad || 0} label={t('偏低 <80%')} total={channels.scored || 0} />
                  <HealthBar color="#bfbfbf" count={notScored} label={t('暂无数据')} total={channels.total || 0} />
                </div>
              </div>
            </article>

            <article className="dashboard-card dashboard-channel-overview">
              <header className="dashboard-card-header"><h2>{t('渠道概况')}</h2></header>
              <div className="dashboard-card-body">
                <div className="dashboard-status-strip">
                  <span><small>{t('启用')}</small><strong className="enabled">{formatInteger(channels.enabled)}</strong></span>
                  <span><small>{t('停用')}</small><strong>{formatInteger(channels.disabled)}</strong></span>
                  <span><small>{t('自动禁用')}</small><strong className="auto-disabled">{formatInteger(channels.auto_disabled)}</strong></span>
                </div>
                <div className="dashboard-category-title">{t('分类分布')}</div>
                <div className="dashboard-category-list">
                  {data?.categories?.length ? data.categories.map((item) => {
                    const color = dashboardCategoryColor(item.category);
                    return (
                      <span key={item.category} style={{ backgroundColor: `${color}14`, color }}>
                        {categoryLabel(item.category, language)} · {formatInteger(item.count)}
                      </span>
                    );
                  }) : <span className="empty">—</span>}
                </div>
              </div>
            </article>
          </div>

          <article className="dashboard-card dashboard-attention-card">
            <header className="dashboard-card-header">
              <h2><AlertTriangle size={16} /> {t('需关注渠道（成功率偏低 / 自动禁用）')}</h2>
              <button onClick={() => setView('my-channels')} type="button">{t('全部')} <ChevronRight size={14} /></button>
            </header>
            <div className="dashboard-attention-body">
              {data?.attention?.length ? (
                <div className="dashboard-attention-table-wrap">
                  <table className="dashboard-attention-table">
                    <thead>
                      <tr>
                        <th>{t('渠道')}</th>
                        <th>{t('标签')}</th>
                        <th>{t('成功率')}</th>
                        <th>{t('近窗口错误')}</th>
                        <th aria-label={t('操作')} />
                      </tr>
                    </thead>
                    <tbody>
                      {data.attention.map((item) => (
                        <tr key={item.id}>
                          <td>{item.channel_name || item.name || ''}</td>
                          <td>{item.tag ? <span className="dashboard-attention-tag">{item.tag}</span> : '-'}</td>
                          <td><span className="dashboard-attention-rate">{((item.success_rate ?? 0) * 100).toFixed(1)}%</span></td>
                          <td>{formatInteger(item.req_error)}</td>
                          <td><button onClick={() => setView('my-channels')} type="button">{t('处理')} <ChevronRight size={13} /></button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="dashboard-attention-empty">
                  <Inbox size={42} strokeWidth={1.2} />
                  <span>{t('一切正常，没有需要关注的渠道')}</span>
                </div>
              )}
            </div>
          </article>

          <article className="dashboard-card dashboard-shortcuts-card">
            <header className="dashboard-card-header"><h2>{t('快捷入口')}</h2></header>
            <div className={`dashboard-shortcut-grid dashboard-shortcut-grid-${shortcuts.length}`}>
              {shortcuts.map((shortcut) => {
                const Icon = shortcut.icon;
                return (
                  <button key={shortcut.view} onClick={() => setView(shortcut.view)} type="button">
                    <Icon color={shortcut.color} size={27} />
                    <span>{t(shortcut.label)}</span>
                  </button>
                );
              })}
            </div>
          </article>
        </>
      )}
    </section>
  );
}

function dashboardHealthColor(rate?: number | null) {
  if (rate == null || rate < 0) return '#bfbfbf';
  if (rate >= 0.95) return '#52c41a';
  if (rate >= 0.8) return '#faad14';
  return '#ff4d4f';
}

function dashboardCategoryColor(category: string) {
  return uploadCategoryCards.find((card) => card.categories.some((item) => item === category))?.color || '#8c8c8c';
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
  onClick,
}: {
  icon: ComponentType<{ size?: number }>;
  label: string;
  value: string;
  color: string;
  onClick?: () => void;
}) {
  const content = (
    <>
      <span className="dashboard-stat-icon" style={{ backgroundColor: `${color}1a`, color }}>
        <Icon size={22} />
      </span>
      <span className="dashboard-stat-copy">
        <small>{label}</small>
        <strong>{value}</strong>
      </span>
    </>
  );

  if (onClick) {
    return (
      <button className="dashboard-stat-card interactive" onClick={onClick} type="button">
        {content}
      </button>
    );
  }

  return <div className="dashboard-stat-card">{content}</div>;
}

function HealthBar({
  color,
  count,
  label,
  total,
}: {
  color: string;
  count: number;
  label: string;
  total: number;
}) {
  const percent = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="dashboard-health-row">
      <i style={{ backgroundColor: color }} />
      <span>{label}</span>
      <div><b style={{ backgroundColor: color, width: `${percent}%` }} /></div>
      <strong>{formatInteger(count)}</strong>
    </div>
  );
}

function PageHeading({
  icon: Icon,
  title,
  subtitle,
  action,
}: {
  icon: ComponentType<{ size?: number }>;
  title: string;
  subtitle: string;
  action?: ReactNode;
}) {
  return (
    <div className="page-heading">
      <div className="heading-icon">
        <Icon size={24} />
      </div>
      <div>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      {action && <div className="heading-action">{action}</div>}
    </div>
  );
}

function UploadView() {
  const { language, t } = useLanguage();
  const [mode, setMode] = useState<'batch' | 'single'>('batch');
  const [switchData, setSwitchData] = useState<UploadSwitch | null>(null);
  const [category, setCategory] = useState('aws');
  const [models, setModels] = useState<string[]>([]);
  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  const [tag, setTag] = useState('');
  const [keys, setKeys] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [remark, setRemark] = useState('');
  const [proxy, setProxy] = useState('');
  const [standby, setStandby] = useState(false);
  const [advanced, setAdvanced] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [results, setResults] = useState<Array<Record<string, unknown>>>([]);

  const categories = switchData?.uploadable_categories?.length
    ? switchData.uploadable_categories
    : Object.keys(categoryLabels);
  const visibleCategoryCards = useMemo(() => {
    const available = new Set(categories);
    return uploadCategoryCards
      .map((card) => ({
        ...card,
        categories: card.categories.filter((item) => available.has(item)),
      }))
      .filter((card) => card.categories.length > 0);
  }, [categories]);
  const activeCategoryCard =
    visibleCategoryCards.find((card) => card.categories.includes(category)) || visibleCategoryCards[0];
  const parsedKeys = useMemo(
    () =>
      keys
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean),
    [keys],
  );
  const uploadItems = useMemo(
    () =>
      parsedKeys.map((line) => {
        if (category !== 'aws_a') {
          return { key: line, base_url: '', remark: '', proxy: '' };
        }

        const [key = '', baseUrl = ''] = line.split(/[,\s]+/).filter(Boolean);
        return { key, base_url: baseUrl, remark: '', proxy: '' };
      }),
    [category, parsedKeys],
  );

  useEffect(() => {
    api<UploadSwitch>('/api/settings/upload-switch')
      .then((data) => {
        setSwitchData(data);
        setCategory((current) =>
          data.uploadable_categories?.length && !data.uploadable_categories.includes(current)
            ? data.uploadable_categories[0]
            : current,
        );
      })
      .catch((error) => {
        setSwitchData({ enabled: true });
        setNotice({
          type: 'error',
          text: error instanceof Error ? error.message : t('加载上传设置失败'),
        });
      });
  }, [t]);

  useEffect(() => {
    api<{ category: string; models: string[] }>(
      `/api/channels/category-models?category=${encodeURIComponent(category)}`,
    )
      .then((data) => {
        setModels(data.models || []);
        setSelectedModels(data.models || []);
      })
      .catch((error) => {
        setModels([]);
        setSelectedModels([]);
        setNotice({
          type: 'error',
          text: error instanceof Error ? error.message : t('加载模型列表失败'),
        });
      });
  }, [category, t]);

  useEffect(() => {
    if (!notice) return;

    const timeout = window.setTimeout(() => setNotice(null), 5_000);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  function toggleModel(model: string) {
    setSelectedModels((current) =>
      current.includes(model)
        ? current.filter((item) => item !== model)
        : [...current, model],
    );
  }

  function selectCategoryCard(card: (typeof visibleCategoryCards)[number]) {
    if (!card.categories.includes(category)) {
      setCategory(card.categories[0]);
      setBaseUrl('');
    }
  }

  const keyListPlaceholder =
    category === 'aws'
      ? language === 'en'
        ? 'AKIxxx1|secret1\nAKIxxx2|secret2   (Region optional and auto-detected; AK|SK|Region is also supported)'
        : 'AKIxxx1|secret1\nAKIxxx2|secret2   （Region 可省略，系统自动探测；也可写 AK|SK|Region）'
      : category === 'aws_a'
        ? 'sk-ant-xxx1,https://a.api.aws\nsk-ant-xxx2,https://b.api.aws'
        : `${(language === 'en' ? keyFormatHintsEn : keyFormatHints)[category] || 'API Key'}\n${language === 'en' ? 'One key per line; duplicates are removed automatically' : '每行一个密钥，系统自动去重'}`;
  const keyInfo =
    category === 'aws'
      ? (language === 'en' ? singleUploadHintsEn.aws : 'Key 格式： AccessKey|SecretKey（AK/SK 模式，Region 可省略，系统自动探测）；或直接填一个 Bedrock API Key（API Key 模式，不带 |）。两种可混传，无需 Base URL')
      : language === 'en'
        ? `Key format: ${keyFormatHintsEn[category] || 'API Key'}. Enter one key per line; duplicates are removed automatically.`
        : `Key 格式：${keyFormatHints[category] || 'API Key'}。每行一个密钥，系统自动去重。`;
  const singleUsesTextarea = category === 'aws' || category === 'azure' || category === 'azure_claude' || category === 'cloudflare';
  const singleKeyLabel = singleUsesTextarea ? t('密钥') : 'API Key';
  const singleKeyPlaceholder =
    category === 'aws'
      ? 'AccessKey|SecretKey|Region'
      : category === 'azure' || category === 'azure_claude'
        ? 'citoai-xxx|ApiKey|2025-04-01-preview'
        : category === 'cloudflare'
          ? 'API-Token|AccountID'
          : category === 'openai'
            ? 'sk-...'
            : category === 'openrouter'
              ? 'sk-or-v1-...'
              : category === 'ocrarouter' || category === 'opencode'
                ? 'API Key'
                : 'sk-ant-xxxxx';

  async function submit(event: FormEvent) {
    event.preventDefault();
    setNotice(null);
    setResults([]);

    if (!tag.trim()) {
      setNotice({ type: 'warn', text: t('请填写全新的标签 / 分组。') });
      return;
    }

    if (!parsedKeys.length) {
      setNotice({ type: 'warn', text: t('请输入至少一条密钥。') });
      return;
    }

    if (mode === 'single' && category === 'aws_a' && !baseUrl.trim()) {
      setNotice({ type: 'warn', text: t('请输入 Base URL。') });
      return;
    }

    setSubmitting(true);
    try {
      const body =
        mode === 'batch'
          ? {
              category,
              tag: tag.trim(),
              items: uploadItems,
              models: selectedModels,
              standby,
              remark: remark.trim(),
              proxy: proxy.trim(),
            }
          : {
              category,
              tag: tag.trim(),
              key: keys.trim(),
              base_url: category === 'aws_a' ? baseUrl.trim() : '',
              models: selectedModels,
              standby,
              remark: remark.trim(),
              proxy: proxy.trim(),
            };
      const path = mode === 'batch' ? '/api/channels/batch' : '/api/channels';
      const data = await api<{
        results?: Array<Record<string, unknown>>;
        total?: number;
        success?: number;
      }>(path, { method: 'POST', body });
      setNotice({
        type: 'ok',
        text: t('提交完成：{{success}}/{{total}} 成功。', {
          success: data.success ?? 0,
          total: data.total ?? parsedKeys.length,
        }),
      });
      setResults(data.results || []);
    } catch (error) {
      const message = error instanceof Error ? error.message : t('提交失败');
      setNotice({
        type: 'error',
        text: message,
      });
    } finally {
      setSubmitting(false);
    }
  }

  if (switchData && !switchData.enabled) {
    return (
      <section className="upload-page">
        <h2>{t('上传 API 密钥')}</h2>
        <div className="upload-disabled">
          <NoticeBanner
            notice={{
              type: 'error',
              text: t('系统维护中，暂停上传。已上传渠道的查询、消费统计不受影响。'),
            }}
          />
        </div>
      </section>
    );
  }

  return (
    <section className="upload-page">
      {notice && (
        <div className={`upload-toast upload-toast-${notice.type}`} role="alert">
          {notice.type === 'ok' ? <CheckCircle2 size={16} /> : notice.type === 'error' ? <XCircle size={16} /> : <AlertTriangle size={16} />}
          <span>{notice.text}</span>
        </div>
      )}
      <h2>{t('上传 API 密钥')}</h2>
      <p className="upload-intro">
        {t('选择分类、粘贴密钥、填写标签即可提交。系统自动创建渠道、归入分组并完成上线。各上游实例可单独限制接收的分类；上传页仅隐藏当前无人接收的分类。')}
      </p>
      <div className="warning-card">
        <span className="warning-icon">
          !
        </span>
        <div>
          <strong>{t('每次上传请使用全新的标签 / 分组')}</strong>
          <p>
            {t('同一标签只能用于一次上传：若标签已存在，系统会拒绝，避免 key 一直往老批次累加、消费与统计混乱。需要再传一批请换一个新标签名。（同一次批量上传里的多个 key 仍会正常归到该新标签下。）')}
          </p>
        </div>
      </div>

      <div className="upload-workspace">
        <div className="upload-tabs" role="tablist">
          <button
            aria-selected={mode === 'batch'}
            className={mode === 'batch' ? 'active' : ''}
            onClick={() => setMode('batch')}
            role="tab"
            type="button"
          >
            {t('批量上传')}
          </button>
          <button
            aria-selected={mode === 'single'}
            className={mode === 'single' ? 'active' : ''}
            onClick={() => setMode('single')}
            role="tab"
            type="button"
          >
            {t('单个上传')}
          </button>
        </div>

        <form className={`upload-workspace-form upload-workspace-form-${mode}`} onSubmit={submit}>
          <div className="upload-left-column">
            <div className="upload-field-title">
              {t('渠道分类')} <span>{t('（可选）')}</span>
            </div>
            <div className="upload-category-grid">
              {visibleCategoryCards.map((card) => {
                const isActive = card.categories.includes(category);
                return (
                  <button
                    className={isActive ? 'upload-category-card active' : 'upload-category-card'}
                    key={card.key}
                    onClick={() => selectCategoryCard(card)}
                    style={{ '--category-color': card.color } as CSSProperties}
                    type="button"
                  >
                    <span className="upload-category-letter">{card.name[0]}</span>
                    <strong>{card.name}</strong>
                    <small>{t(card.provider)}</small>
                  </button>
                );
              })}
            </div>

            {activeCategoryCard && activeCategoryCard.categories.length > 1 && (
              <div className="upload-category-variants">
                {activeCategoryCard.categories.map((item) => (
                  <button
                    className={category === item ? 'active' : ''}
                    key={item}
                    onClick={() => {
                      setCategory(item);
                      setBaseUrl('');
                    }}
                    type="button"
                  >
                    {(language === 'en' ? uploadCategoryVariantsEn : uploadCategoryVariants)[item] || categoryLabel(item, language)}
                  </button>
                ))}
              </div>
            )}

            {mode === 'batch' && (
              <div className="upload-key-info">
                <Info size={22} />
                <div>
                  <strong>{t('每行一个密钥')}</strong>
                  <p>{keyInfo}</p>
                </div>
              </div>
            )}

            <label className="upload-tag-field">
              <span>
                {t('标签 / 分组')} <span className="field-help">?</span>
              </span>
              <span className="tag-input-wrap">
                <Tag aria-hidden="true" size={15} />
                <input
                  value={tag}
                  onChange={(event) => setTag(event.target.value)}
                  placeholder={t('输入一个全新的标签名（不可与已有重复），例如：客户A-20260701')}
                />
              </span>
            </label>

            <button
              aria-expanded={advanced}
              className="upload-advanced-toggle"
              onClick={() => setAdvanced(!advanced)}
              type="button"
            >
              <ChevronRight className={advanced ? 'rotate' : ''} size={16} />
              {t('高级选项（模型范围 · RPM · 号况 · 备注 · 代理，默认全部模型）')}
            </button>

            {advanced && (
              <div className="upload-advanced-content">
                <div className="model-picker">
                  <div>
                    <strong>{t('可用模型范围')}</strong>
                    <span>
                      {t('已选 {{selected}}/{{total}}', { selected: selectedModels.length, total: models.length || 0 })}
                    </span>
                  </div>
                  {models.length ? (
                    <div className="chip-grid">
                      {models.map((model) => (
                        <button
                          className={selectedModels.includes(model) ? 'chip selected' : 'chip'}
                          key={model}
                          onClick={() => toggleModel(model)}
                          type="button"
                        >
                          {model}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <span className="muted">{t('该分类暂未返回模型范围，默认使用全部模型。')}</span>
                  )}
                </div>
                <label className="check-row">
                  <input checked={standby} onChange={(event) => setStandby(event.target.checked)} type="checkbox" />
                  <span>{t('入库存（备用，暂不上线）')}</span>
                </label>
                <label>
                  <span>{t('备注（可选）')}</span>
                  <textarea
                    value={remark}
                    onChange={(event) => setRemark(event.target.value)}
                    rows={3}
                    placeholder={t('写一行 = 全部共用；也可一行一个，与密钥逐行对应')}
                  />
                </label>
                <label>
                  <span>{t('代理 SOCKS5/HTTP（可选）')}</span>
                  <textarea
                    value={proxy}
                    onChange={(event) => setProxy(event.target.value)}
                    rows={3}
                    placeholder="socks5://user:pass@host:port"
                  />
                </label>
              </div>
            )}

            <button
              className="upload-submit-button"
              disabled={submitting || !tag.trim() || !parsedKeys.length || (mode === 'single' && category === 'aws_a' && !baseUrl.trim())}
              type="submit"
            >
              {submitting ? <Loader2 className="spin" size={17} /> : <UploadCloud size={17} />}
              {standby ? t('入库存') : mode === 'batch' ? t('批量提交') : t('提交密钥')}
            </button>
          </div>

          <div className="upload-right-column">
            {mode === 'batch' ? (
              <>
                <label className="upload-key-list-field">
                  <span>
                    {t('密钥列表（一行一个，自动去重）')} <i>{t('（可选）')}</i>
                  </span>
                  <textarea
                    value={keys}
                    onChange={(event) => setKeys(event.target.value)}
                    placeholder={keyListPlaceholder}
                    rows={14}
                  />
                </label>
                {keys.trim() && (
                  <div className="upload-key-count">{t('可上传 {{count}} 条', { count: parsedKeys.length })}</div>
                )}
              </>
            ) : (
              <>
                <div className="upload-single-key-info">
                  <Info size={15} />
                  <span>{(language === 'en' ? singleUploadHintsEn : singleUploadHints)[category] || t('请填写该渠道的 API Key。')}</span>
                </div>
                <label className="upload-single-key-field">
                  <span>{singleKeyLabel}</span>
                  {singleUsesTextarea ? (
                    <textarea
                      value={keys}
                      onChange={(event) => setKeys(event.target.value)}
                      placeholder={singleKeyPlaceholder}
                      rows={2}
                    />
                  ) : (
                    <input
                      autoComplete="off"
                      value={keys}
                      onChange={(event) => setKeys(event.target.value)}
                      placeholder={singleKeyPlaceholder}
                      type="password"
                    />
                  )}
                </label>
                {category === 'aws_a' && (
                  <label className="upload-single-key-field upload-single-base-url">
                    <span>Base URL</span>
                    <input
                      autoComplete="off"
                      value={baseUrl}
                      onChange={(event) => setBaseUrl(event.target.value)}
                      placeholder="https://abcd1234.api.aws"
                      type="url"
                    />
                  </label>
                )}
              </>
            )}
          </div>
        </form>

        {results.length > 0 && (
          <div className="result-list">
            {results.slice(0, 20).map((row, index) => (
              <div key={`${index}-${String(row.key || '')}`} className="result-row">
                <span>#{String(row.index ?? index + 1)}</span>
                <code>{String(row.key || row.channel_id || '-')}</code>
                <Badge tone={row.success ? 'green' : 'red'}>{row.success ? t('成功') : t('失败')}</Badge>
                <small>{String(row.message || '')}</small>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function MyChannelsView() {
  const { language, t } = useLanguage();
  const [viewMode, setViewMode] = useState<'group' | 'list'>('group');
  const [items, setItems] = useState<ChannelItem[]>([]);
  const [groups, setGroups] = useState<ChannelGroupSummary[]>([]);
  const [summary, setSummary] = useState<ChannelSummary>({ count: 0, total_quota: 0 });
  const [tags, setTags] = useState<string[]>([]);
  const [status, setStatus] = useState('');
  const [tag, setTag] = useState('');
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [groupPage, setGroupPage] = useState(1);
  const [listPage, setListPage] = useState(1);
  const [groupTotal, setGroupTotal] = useState(0);
  const [listTotal, setListTotal] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const [expandedTags, setExpandedTags] = useState<string[]>([]);
  const [groupDetails, setGroupDetails] = useState<Record<string, ChannelItem[]>>({});
  const [detailLoading, setDetailLoading] = useState<Record<string, boolean>>({});
  const [syncing, setSyncing] = useState(false);
  const [keywordsOpen, setKeywordsOpen] = useState(false);
  const [disableKeywords, setDisableKeywords] = useState<DisableKeyword[]>([]);
  const [newKeyword, setNewKeyword] = useState('');
  const [keywordsLoading, setKeywordsLoading] = useState(false);
  const [keywordSaving, setKeywordSaving] = useState(false);
  const [rowAction, setRowAction] = useState<{ id: number; type: 'status' | 'delete' } | null>(null);
  const [testChannelItem, setTestChannelItem] = useState<ChannelItem | null>(null);
  const [testMode, setTestMode] = useState<'newapi' | 'direct'>('direct');
  const [testContent, setTestContent] = useState('');
  const [testModels, setTestModels] = useState<string[]>([]);
  const [testModel, setTestModel] = useState('');
  const [testLoading, setTestLoading] = useState(false);
  const [testResults, setTestResults] = useState<ChannelTestResult[]>([]);
  const [testProgress, setTestProgress] = useState<{ done: number; total: number } | null>(null);
  const [testError, setTestError] = useState('');
  const [testToast, setTestToast] = useState<{ id: number; text: string } | null>(null);

  const applyDateRange = useCallback((params: URLSearchParams) => {
    if (dateRange.from) params.set('created_from', dateRange.from);
    if (dateRange.to) params.set('created_to', dateRange.to);
  }, [dateRange.from, dateRange.to]);

  const load = useCallback(async (fresh = false) => {
    setLoading(true);
    setNotice(null);

    try {
      if (viewMode === 'group') {
        const groupParams = new URLSearchParams({
          page: String(groupPage),
          page_size: String(pageSize),
        });
        applyDateRange(groupParams);
        const [summaryData, tagData, groupData] = await Promise.all([
          api<ChannelSummary>('/api/channels/summary', { fresh }),
          api<string[]>('/api/channels/tags', { fresh }),
          api<{ items?: ChannelGroupSummary[]; total?: number; total_groups?: number }>(
            `/api/channels/tag-summary?${groupParams.toString()}`,
            { fresh },
          ),
        ]);
        setSummary(summaryData);
        setTags(tagData);
        setGroups(groupData.items || []);
        setGroupTotal(groupData.total ?? groupData.total_groups ?? groupData.items?.length ?? 0);
      } else {
        const params = new URLSearchParams({ page: String(listPage), page_size: String(pageSize) });
        if (status) params.set('status', status);
        if (tag) params.set('tag', tag);
        if (keyword.trim()) params.set('keyword', keyword.trim());
        applyDateRange(params);
        const [summaryData, tagData, listData] = await Promise.all([
          api<ChannelSummary>('/api/channels/summary', { fresh }),
          api<string[]>('/api/channels/tags', { fresh }),
          api<ChannelListData>(`/api/channels?${params.toString()}`, { fresh }),
        ]);
        setSummary(summaryData);
        setTags(tagData);
        setItems(listData.items || []);
        setListTotal(listData.total || 0);
      }
    } catch (error) {
      setNotice({
        type: 'error',
        text: error instanceof Error ? error.message : t('加载渠道失败'),
      });
    } finally {
      setLoading(false);
    }
  }, [applyDateRange, groupPage, keyword, listPage, pageSize, status, t, tag, viewMode]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!testToast) return;
    const timeout = window.setTimeout(() => setTestToast(null), 3000);
    return () => window.clearTimeout(timeout);
  }, [testToast]);

  const pageCount = Math.max(1, Math.ceil((viewMode === 'group' ? groupTotal : listTotal) / pageSize));
  const currentPage = viewMode === 'group' ? groupPage : listPage;
  const paginationItems = useMemo(
    () => createPaginationItems(currentPage, pageCount),
    [currentPage, pageCount],
  );
  const testSuccessCount = testResults.filter((result) => result.success).length;
  const testHasMultipleInstances = testResults.some((result) => result.instance_id)
    && new Set(testResults.map((result) => result.instance_id)).size > 1;

  function changeView(nextView: 'group' | 'list') {
    if (nextView === viewMode) return;
    setViewMode(nextView);
    setNotice(null);
  }

  function updateDateRange(part: 'from' | 'to', value: string) {
    setDateRange((current) => ({ ...current, [part]: value }));
    setGroupPage(1);
    setListPage(1);
  }

  function changePage(nextPage: number) {
    const bounded = Math.max(1, Math.min(pageCount, nextPage));
    if (viewMode === 'group') setGroupPage(bounded);
    else setListPage(bounded);
  }

  function changePageSize(nextSize: number) {
    setPageSize(nextSize);
    setGroupPage(1);
    setListPage(1);
  }

  async function toggleGroup(group: ChannelGroupSummary) {
    const key = group.tag || '__untagged__';
    const expanded = expandedTags.includes(key);
    setExpandedTags((current) => (expanded ? current.filter((item) => item !== key) : [...current, key]));
    if (expanded || groupDetails[key] || detailLoading[key]) return;

    setDetailLoading((current) => ({ ...current, [key]: true }));
    try {
      const params = new URLSearchParams({ page: '1', page_size: '500' });
      if (group.tag) params.set('tag', group.tag);
      else params.set('untagged', 'true');
      applyDateRange(params);
      const result = await api<ChannelListData>(`/api/channels?${params.toString()}`, { fresh: true });
      setGroupDetails((current) => ({ ...current, [key]: result.items || [] }));
    } catch (error) {
      setExpandedTags((current) => current.filter((item) => item !== key));
      setNotice({
        type: 'error',
        text: error instanceof Error ? error.message : t('加载批次明细失败'),
      });
    } finally {
      setDetailLoading((current) => ({ ...current, [key]: false }));
    }
  }

  async function syncUsage() {
    setSyncing(true);
    setNotice(null);
    try {
      const result = await api<{ message?: string }>('/api/channels/sync', { method: 'POST' });
      setNotice({ type: 'ok', text: result.message || t('同步用量任务已提交。') });
      await load(true);
    } catch (error) {
      setNotice({
        type: 'error',
        text: error instanceof Error ? error.message : t('同步用量失败'),
      });
    } finally {
      setSyncing(false);
    }
  }

  async function openDisableKeywords() {
    setKeywordsOpen(true);
    setKeywordsLoading(true);
    try {
      const result = await api<DisableKeyword[] | { items?: DisableKeyword[] }>('/api/disable-keywords', { fresh: true });
      setDisableKeywords(Array.isArray(result) ? result : result.items || []);
    } catch (error) {
      setNotice({ type: 'error', text: error instanceof Error ? error.message : t('加载建议禁用词失败') });
    } finally {
      setKeywordsLoading(false);
    }
  }

  async function addDisableKeyword(event: FormEvent) {
    event.preventDefault();
    const value = newKeyword.trim();
    if (!value) return;
    setKeywordSaving(true);
    try {
      await api('/api/disable-keywords', { method: 'POST', body: { keyword: value } });
      setNewKeyword('');
      await openDisableKeywords();
    } catch (error) {
      setNotice({ type: 'error', text: error instanceof Error ? error.message : t('添加禁用词失败') });
    } finally {
      setKeywordSaving(false);
    }
  }

  function manageGroup(group: ChannelGroupSummary) {
    setTag(group.tag || '');
    setKeyword('');
    setListPage(1);
    setViewMode('list');
  }

  function openChannelTest(item: ChannelItem) {
    const models = (item.models || '')
      .split(',')
      .map((model) => model.trim())
      .filter(Boolean);

    setTestChannelItem(item);
    setTestMode('direct');
    setTestContent('');
    setTestModels(models);
    setTestModel(models[0] || '');
    setTestResults([]);
    setTestProgress(null);
    setTestError('');
    setTestToast(null);
  }

  function closeChannelTest() {
    if (testLoading) return;
    setTestChannelItem(null);
  }

  function changeTestMode(mode: 'newapi' | 'direct') {
    setTestMode(mode);
    setTestResults([]);
    setTestProgress(null);
    setTestError('');
  }

  async function runChannelModelTest(model: string) {
    if (!testChannelItem) return [];

    const params = new URLSearchParams({ model, mode: testMode });
    if (testMode === 'direct' && testContent.trim()) {
      params.set('content', testContent.trim());
    }
    const response = await api<ChannelTestResult[]>(
      `/api/channels/${testChannelItem.id}/test?${params.toString()}`,
      { fresh: true },
    );
    const results = Array.isArray(response) ? response : [];
    return results.map((result, index) => ({
      ...result,
      model,
      key: `${model}@${result.instance_id || index}`,
    }));
  }

  async function testSelectedModel() {
    if (!testModel) {
      setTestError(t('请选择模型'));
      return;
    }

    setTestLoading(true);
    setTestResults([]);
    setTestProgress(null);
    setTestError('');
    try {
      setTestResults(await runChannelModelTest(testModel));
    } catch (error) {
      setTestToast({
        id: Date.now(),
        text: error instanceof Error ? error.message : t('测试失败'),
      });
    } finally {
      setTestLoading(false);
    }
  }

  async function testAllModels() {
    if (!testModels.length) {
      setTestError(t('该渠道没有可测试的模型'));
      return;
    }

    setTestLoading(true);
    setTestResults([]);
    setTestError('');
    setTestProgress({ done: 0, total: testModels.length });

    const queue = [...testModels];
    const collected: ChannelTestResult[] = [];
    let completed = 0;
    const worker = async () => {
      while (queue.length) {
        const model = queue.shift();
        if (!model) continue;
        try {
          collected.push(...await runChannelModelTest(model));
        } catch (error) {
          collected.push({
            model,
            success: false,
            message: error instanceof Error ? error.message : t('失败'),
            latency: 0,
            key: `${model}@err`,
          });
        }
        completed += 1;
        setTestResults([...collected]);
        setTestProgress({ done: completed, total: testModels.length });
      }
    };

    await Promise.all(
      Array.from({ length: Math.min(3, testModels.length) }, () => worker()),
    );
    setTestLoading(false);
  }

  async function changeChannelStatus(item: ChannelItem) {
    const nextStatus = item.status === 1 ? 2 : 1;
    const actionLabel = nextStatus === 1 ? '启用' : '停用';
    if (!window.confirm(t(`确定${actionLabel}该渠道？`))) return;

    setRowAction({ id: item.id, type: 'status' });
    setNotice(null);
    try {
      await api(`/api/channels/${item.id}/status`, {
        method: 'POST',
        body: { status: nextStatus },
      });
      setItems((current) => current.map((channel) => (
        channel.id === item.id ? { ...channel, status: nextStatus } : channel
      )));
      setNotice({ type: 'ok', text: t(`渠道已${actionLabel}`) });
    } catch (error) {
      setNotice({ type: 'error', text: error instanceof Error ? error.message : t(`${actionLabel}渠道失败`) });
    } finally {
      setRowAction(null);
    }
  }

  async function deleteChannel(item: ChannelItem) {
    if (!window.confirm(t('确定删除？将同步用量并禁用上游渠道，删除后不可恢复。'))) return;

    setRowAction({ id: item.id, type: 'delete' });
    setNotice(null);
    try {
      await api(`/api/channels/${item.id}`, { method: 'DELETE' });
      setNotice({ type: 'ok', text: t('删除成功') });
      await load(true);
    } catch (error) {
      setNotice({ type: 'error', text: error instanceof Error ? error.message : t('删除渠道失败') });
    } finally {
      setRowAction(null);
    }
  }

  return (
    <section className="my-channels-page">
      {testToast && (
        <div className="upload-toast upload-toast-error channel-test-toast" key={testToast.id} role="alert">
          <XCircle size={16} />
          <span>{testToast.text}</span>
        </div>
      )}
      <NoticeBanner notice={notice} />
      <div className="my-channel-summary-grid">
        <article className="my-channel-summary-card">
          <span>{t('渠道总数')}</span>
          <strong>{formatInteger(summary.count)}</strong>
        </article>
        <article className="my-channel-summary-card">
          <span>{t('总消耗（全部渠道）')}</span>
          <strong>{formatQuota(summary.total_quota)}</strong>
        </article>
      </div>

      <div className="my-channels-titlebar">
        <h1>{t('我的渠道')}</h1>
        <div className="my-channels-actions">
          <button className="primary-button compact" disabled={syncing} onClick={syncUsage} type="button">
            <RefreshCcw className={syncing ? 'spin' : ''} size={15} />
            {syncing ? t('同步中...') : t('同步用量')}
          </button>
          <button className="ghost-button compact" disabled={loading} onClick={() => load(true)} type="button">
            <RefreshCcw className={loading ? 'spin' : ''} size={15} />
            {t('刷新')}
          </button>
          <button className="ghost-button compact" onClick={openDisableKeywords} type="button">
            <AlertTriangle size={15} />
            {t('建议禁用词')}
          </button>
        </div>
      </div>

      <div className="my-channel-filters">
        <div className="my-channel-view-switch" role="tablist" aria-label={t('我的渠道')}>
          <button className={viewMode === 'group' ? 'active' : ''} onClick={() => changeView('group')} type="button">
              {t('分组视图')}
            </button>
          <button className={viewMode === 'list' ? 'active' : ''} onClick={() => changeView('list')} type="button">
              {t('列表视图')}
          </button>
        </div>
        <span className="my-channel-filter-label">{t('筛选:')}</span>
        <label className="my-channel-date-range">
          <span className="my-channel-date-field">
            <input
              aria-label={t('创建起')}
              className={dateRange.from ? '' : 'empty'}
              max={dateRange.to || undefined}
              onChange={(event) => updateDateRange('from', event.target.value)}
              type="date"
              value={dateRange.from}
            />
            {!dateRange.from && <span className="my-channel-date-placeholder">{t('创建起')}</span>}
          </span>
          <span className="my-channel-date-separator">→</span>
          <span className="my-channel-date-field">
            <input
              aria-label={t('创建止')}
              className={dateRange.to ? '' : 'empty'}
              min={dateRange.from || undefined}
              onChange={(event) => updateDateRange('to', event.target.value)}
              type="date"
              value={dateRange.to}
            />
            {!dateRange.to && <span className="my-channel-date-placeholder">{t('创建止')}</span>}
          </span>
          <CalendarDays className="my-channel-date-icon" size={14} />
        </label>
        {viewMode === 'list' && (
          <>
            <select value={status} onChange={(event) => { setStatus(event.target.value); setListPage(1); }}>
            <option value="">{t('全部状态')}</option>
            <option value="1">{t('启用')}</option>
            <option value="2">{t('禁用')}</option>
            <option value="3">{t('自动禁用')}</option>
          </select>
            <select value={tag} onChange={(event) => { setTag(event.target.value); setListPage(1); }}>
            <option value="">{t('全部标签')}</option>
            {tags.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
            <div className="search-box my-channel-search-box">
              <Search size={15} />
              <input
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    setListPage(1);
                    load(true);
                  }
                }}
                placeholder={t('搜索 ID / 渠道名 / 备注 / Key')}
              />
            </div>
          </>
        )}
      </div>

      <div className="my-channel-table-wrap">
        {loading ? (
          <div className="loading-block my-channel-loading">
            <Loader2 className="spin" />
            {t('正在加载渠道')}
          </div>
        ) : viewMode === 'group' ? (
          groups.length ? (
            <table className="my-channel-table">
              <thead>
                <tr>
                  <th className="my-channel-expand-heading" aria-label={t('展开')} />
                  <th>{t('标签 / 分组（批次）')}</th>
                  <th>{t('Key 数量')}</th>
                  <th>{t('上传去向(最近一次)')}</th>
                  <th>{t('启用 / 停用')}</th>
                  <th>{t('该批已用额度($)')}</th>
                  <th>{t('操作')}</th>
                </tr>
              </thead>
              <tbody>
                {groups.map((group, index) => {
                  const key = group.tag || '__untagged__';
                  const expanded = expandedTags.includes(key);
                  const enabled = Number(group.enabled || 0);
                  const total = Number(group.count || group.key_count || 0);
                  const disabled = Math.max(0, total - enabled);
                  return (
                    <Fragment key={`${key}-${index}`}>
                      <tr>
                        <td className="my-channel-expand-cell">
                          <button
                            aria-expanded={expanded}
                            aria-label={`${t('展开')} ${group.tag || t('未分组')}`}
                            className={expanded ? 'expanded' : ''}
                            onClick={() => toggleGroup(group)}
                            type="button"
                          >
                            <ChevronRight size={16} />
                          </button>
                        </td>
                        <td><span className="my-channel-tag">{group.tag || t('未分组')}</span></td>
                        <td className="my-channel-key-count">{formatInteger(group.key_count || group.count || 0)}</td>
                        <td>
                          <div className="my-channel-upload-result">
                            <span className="submitted">{t('提交 {{count}}', { count: formatInteger(group.submitted || 0) })}</span>
                            <span className="added">{t('新增 {{count}}', { count: formatInteger(group.added || 0) })}</span>
                            {!!group.skipped_dup && <span className="neutral">{t('重复 {{count}}', { count: formatInteger(group.skipped_dup) })}</span>}
                            {!!group.invalid && <span className="warning">{t('无效 {{count}}', { count: formatInteger(group.invalid) })}</span>}
                            {!!group.failed && <span className="failed">{t('失败 {{count}}', { count: formatInteger(group.failed) })}</span>}
                          </div>
                        </td>
                        <td>
                          <div className="my-channel-status-pair">
                            <span className="enabled">{t('{{count}} 启用', { count: formatInteger(enabled) })}</span>
                            <span>{t('{{count}} 停用', { count: formatInteger(disabled) })}</span>
                          </div>
                        </td>
                        <td>{formatQuota(group.used_quota || group.quota)}</td>
                        <td>
                          <button className="my-channel-manage-button" onClick={() => manageGroup(group)} type="button">
                            {t('在列表中管理')}
                          </button>
                        </td>
                      </tr>
                      {expanded && (
                        <tr className="my-channel-detail-row">
                          <td colSpan={7}>
                            {detailLoading[key] ? (
                              <div className="my-channel-detail-loading"><Loader2 className="spin" size={16} /> {t('正在加载明细')}</div>
                            ) : groupDetails[key]?.length ? (
                              <table className="my-channel-detail-table">
                                <thead>
                                  <tr>
                                    <th>ID</th>
                                    <th>{t('渠道名称')}</th>
                                    <th>{t('分类')}</th>
                                    <th>Key</th>
                                    <th>{t('备注')}</th>
                                    <th>{t('状态')}</th>
                                    <th>{t('已用额度($)')}</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {groupDetails[key].map((item) => (
                                    <tr key={item.id}>
                                      <td>{item.id}</td>
                                      <td>{item.channel_name || item.name || '-'}</td>
                                      <td>{categoryLabel(item.category || '', language) || item.type || '-'}</td>
                                      <td><code>{item.key_masked || item.key || '-'}</code></td>
                                      <td>{item.remark || '-'}</td>
                                      <td><Badge tone={item.status === 1 ? 'green' : item.status === 3 ? 'orange' : 'red'}>{statusLabel(item.status, language)}</Badge></td>
                                      <td>{formatQuota(item.used_quota || item.quota)}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            ) : (
                              <span className="my-channel-detail-empty">{t('暂无渠道明细。')}</span>
                            )}
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <EmptyState title={t('暂无批次')} description={t('这个账号当前没有渠道分组数据。')} />
          )
        ) : items.length ? (
          <table className="my-channel-table my-channel-list-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>{t('渠道名称')}</th>
                  <th>{t('分类')}</th>
                  <th>{t('标签')}</th>
                  <th>Key</th>
                  <th>{t('已用额度')}</th>
                  <th>{t('状态')}</th>
                  <th>{t('创建时间')}</th>
                  <th>{t('操作')}</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td>{item.id}</td>
                    <td>{item.channel_name || item.name || '-'}</td>
                    <td>
                      <Badge tone="purple">{categoryLabel(item.category || '', language) || item.type || '-'}</Badge>
                    </td>
                    <td>{item.tag || '-'}</td>
                    <td>
                      <code>{item.key_masked || item.key || '-'}</code>
                    </td>
                    <td>{formatQuota(item.used_quota || item.quota)}</td>
                    <td>
                      <Badge tone={item.status === 1 ? 'green' : item.status === 3 ? 'orange' : 'red'}>
                        {statusLabel(item.status, language)}
                      </Badge>
                    </td>
                    <td>{formatDate(item.created_at, language)}</td>
                    <td className="my-channel-row-actions-cell">
                      <div className="my-channel-row-actions">
                        <button
                          disabled={rowAction?.id === item.id}
                          onClick={() => openChannelTest(item)}
                          type="button"
                        >
                          <Activity size={13} />
                          {t('测试')}
                        </button>
                        {item.status !== 0 && (
                          <button
                            className={item.status === 1 ? '' : 'enable'}
                            disabled={rowAction?.id === item.id}
                            onClick={() => changeChannelStatus(item)}
                            type="button"
                          >
                            {rowAction?.id === item.id && rowAction.type === 'status'
                              ? <Loader2 className="spin" size={13} />
                              : item.status === 1 ? <XCircle size={13} /> : <CheckCircle2 size={13} />}
                            {item.status === 1 ? t('停用') : t('启用')}
                          </button>
                        )}
                        {item.status === 0 ? (
                          <Badge tone="neutral">{t('已删除')}</Badge>
                        ) : (
                          <button
                            className="danger"
                            disabled={rowAction?.id === item.id}
                            onClick={() => deleteChannel(item)}
                            type="button"
                          >
                            {rowAction?.id === item.id && rowAction.type === 'delete'
                              ? <Loader2 className="spin" size={13} />
                              : <Trash2 size={13} />}
                            {t('删除')}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
        ) : (
          <EmptyState title={t('暂无渠道')} description={t('原站当前返回空列表，上传后会自动显示在这里。')} />
        )}
      </div>

      {!loading && (viewMode === 'group' ? groups.length > 0 : items.length > 0) && (
        <div className="my-channel-pagination">
          <span>{viewMode === 'group'
            ? t('共 {{count}} 个批次', { count: groupTotal })
            : t('共 {{count}} 条', { count: listTotal })}</span>
          <div className="my-channel-pagination-controls">
            <button className="pagination-arrow" aria-label={t('上一页')} disabled={currentPage <= 1} onClick={() => changePage(currentPage - 1)} type="button">
              <ChevronLeft size={16} />
            </button>
            {paginationItems.map((item) =>
              typeof item === 'number' ? (
                <button
                  aria-current={item === currentPage ? 'page' : undefined}
                  className={`pagination-page ${item === currentPage ? 'current' : ''}`}
                  key={item}
                  onClick={() => changePage(item)}
                  type="button"
                >
                  {item}
                </button>
              ) : (
                <button
                  aria-label={t(item === 'backward' ? '向前跳转 5 页' : '向后跳转 5 页')}
                  className="pagination-ellipsis"
                  key={item}
                  onClick={() => changePage(currentPage + (item === 'backward' ? -5 : 5))}
                  type="button"
                >
                  ...
                </button>
              ),
            )}
            <button className="pagination-arrow" aria-label={t('下一页')} disabled={currentPage >= pageCount} onClick={() => changePage(currentPage + 1)} type="button">
              <ChevronRight size={16} />
            </button>
            <select aria-label={t('每页数量')} onChange={(event) => changePageSize(Number(event.target.value))} value={pageSize}>
              <option value={20}>{t('{{count}} 条/页', { count: 20 })}</option>
              <option value={50}>{t('{{count}} 条/页', { count: 50 })}</option>
              <option value={100}>{t('{{count}} 条/页', { count: 100 })}</option>
            </select>
          </div>
        </div>
      )}

      {testChannelItem && (
        <div
          className="dialog-backdrop channel-test-backdrop"
          onMouseDown={closeChannelTest}
          role="presentation"
        >
          <section
            aria-labelledby="channel-test-title"
            aria-modal="true"
            className="channel-test-dialog"
            onMouseDown={(event) => event.stopPropagation()}
            role="dialog"
          >
            <header className="channel-test-header">
              <h2 id="channel-test-title">
                <Zap size={17} />
                <span>{t('测试渠道 - {{name}}', { name: testChannelItem.channel_name || testChannelItem.name || '' })}</span>
              </h2>
              <button
                aria-label={t('关闭')}
                className="channel-test-close"
                disabled={testLoading}
                onClick={closeChannelTest}
                type="button"
              >
                <X size={18} />
              </button>
            </header>

            <div className="channel-test-body">
              <div className="channel-test-mode-switch" role="group" aria-label={t('测试方式')}>
                <button
                  className={testMode === 'newapi' ? 'active' : ''}
                  disabled={testLoading}
                  onClick={() => changeTestMode('newapi')}
                  type="button"
                >
                  {t('经 New API（真实链路）')}
                </button>
                <button
                  className={testMode === 'direct' ? 'active' : ''}
                  disabled={testLoading}
                  onClick={() => changeTestMode('direct')}
                  type="button"
                >
                  {t('直连官方（验证密钥本身）')}
                </button>
              </div>

              <div className="channel-test-alert info">
                <Info size={16} />
                <span>
                  {testMode === 'direct'
                    ? t('不经过 New API，直接用渠道原始密钥请求官方，验证密钥本身是否有效，可自定义发送内容。')
                    : t('经 New API 用该渠道的 Key 向所选模型发探测请求，反映客户真实可用性（含分组/重定向配置）。')}
                </span>
              </div>

              {testMode === 'direct' && testChannelItem.category === 'aws' && (
                <div className="channel-test-alert warning">
                  <AlertTriangle size={16} />
                  <span>{t('AWS Bedrock 直连只验证密钥(AK/SK)本身。真实模型 id 由 New API 转换，直连可能报「模型 id 无效」，但这不代表密钥坏了——已自动按「密钥有效」判定；若显示 403「该账号未开通此模型」则是真不可用，需在 AWS 控制台开通该模型访问后重新上线。测实际可用性请切到「经 New API」。')}</span>
                </div>
              )}

              {testMode === 'direct' && (
                <input
                  className="channel-test-content-input"
                  disabled={testLoading}
                  maxLength={200}
                  onChange={(event) => setTestContent(event.target.value)}
                  placeholder={t('自定义发送内容（留空=随机友好语：hi! / 你好~ / ping）')}
                  value={testContent}
                />
              )}

              <div className="channel-test-controls">
                <select
                  aria-label={t('选择要测试的模型')}
                  disabled={testLoading || !testModels.length}
                  onChange={(event) => setTestModel(event.target.value)}
                  value={testModel}
                >
                  {!testModels.length && <option value="">{t('选择要测试的模型')}</option>}
                  {testModels.map((model) => <option key={model} value={model}>{model}</option>)}
                </select>
                <button
                  className="primary-button channel-test-action"
                  disabled={testLoading || !testModel}
                  onClick={testSelectedModel}
                  type="button"
                >
                  {testLoading && !testProgress && <Loader2 className="spin" size={15} />}
                  {t('测试该模型')}
                </button>
                <button
                  className="ghost-button channel-test-action"
                  disabled={testLoading || !testModels.length}
                  onClick={testAllModels}
                  type="button"
                >
                  {testLoading && testProgress
                    ? <Loader2 className="spin" size={15} />
                    : <Zap size={15} />}
                  {t('测试全部模型（{{count}}）', { count: testModels.length })}
                </button>
              </div>

              {testError && (
                <div className="channel-test-error" role="alert">
                  <XCircle size={15} />
                  <span>{testError}</span>
                </div>
              )}

              {testProgress && (
                <div className="channel-test-progress" aria-label={t('测试进度 {{done}}/{{total}}', { done: testProgress.done, total: testProgress.total })}>
                  <div><span style={{ width: `${Math.round((testProgress.done / testProgress.total) * 100)}%` }} /></div>
                  <strong>{testProgress.done}/{testProgress.total}</strong>
                </div>
              )}

              {testResults.length > 0 && (
                <div className="channel-test-summary">
                  <span className="success">{t('可用 {{count}}', { count: testSuccessCount })}</span>
                  <span className="failed">{t('失败 {{count}}', { count: testResults.length - testSuccessCount })}</span>
                  <small>{t('共 {{count}} 项', { count: testResults.length })}</small>
                </div>
              )}

              <div className="channel-test-table-wrap">
                <table className="channel-test-table">
                  <thead>
                    <tr>
                      <th>{t('模型')}</th>
                      {testHasMultipleInstances && <th className="instance">{t('实例')}</th>}
                      <th className="result">{t('结果')}</th>
                      <th className="latency">{t('耗时')}</th>
                      <th>{t('信息')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {testResults.length ? testResults.map((result, index) => (
                      <tr key={result.key || `${result.model || 'model'}-${index}`}>
                        <td title={result.model}>{result.model || '-'}</td>
                        {testHasMultipleInstances && <td>{result.instance_name || '-'}</td>}
                        <td>
                          <span className={`channel-test-result ${result.success ? 'success' : 'failed'}`}>
                            {result.success ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                            {result.success ? t('可用') : t('失败')}
                          </span>
                        </td>
                        <td>{result.latency ? `${Number(result.latency).toFixed(2)}s` : '-'}</td>
                        <td className="message" title={result.message}>{result.message || '-'}</td>
                      </tr>
                    )) : (
                      <tr className="channel-test-empty-row">
                        <td colSpan={testHasMultipleInstances ? 5 : 4}>{t('选择模型后点击上方按钮开始测试')}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <footer className="channel-test-footer">
              <button className="ghost-button" disabled={testLoading} onClick={closeChannelTest} type="button">{t('关闭')}</button>
            </footer>
          </section>
        </div>
      )}

      {keywordsOpen && (
        <div className="dialog-backdrop" role="presentation" onMouseDown={() => setKeywordsOpen(false)}>
          <section className="keyword-dialog" role="dialog" aria-modal="true" aria-label={t('建议禁用词')} onMouseDown={(event) => event.stopPropagation()}>
            <div className="keyword-dialog-header">
              <h2>{t('建议自动禁用关键词')}</h2>
              <button className="icon-button" aria-label={t('关闭')} onClick={() => setKeywordsOpen(false)} type="button"><X size={18} /></button>
            </div>
            <div className="keyword-dialog-alert">
              <Info size={16} />
              <span>{t('如果你发现某种上游报错代表 key 已经死了（如欠费、被封号），可把报错里的特征片段提交给我们。管理员审核通过后，健康体检命中该片段就会自动下架对应渠道。')}</span>
            </div>
            <form className="keyword-dialog-form" onSubmit={addDisableKeyword}>
              <input
                maxLength={256}
                value={newKeyword}
                onChange={(event) => setNewKeyword(event.target.value)}
                placeholder={t('例如 Your credit balance is too low')}
              />
              <button className="primary-button compact" disabled={keywordSaving} type="submit">
                {keywordSaving && <Loader2 className="spin" size={15} />}
                {t('提交')}
              </button>
            </form>
            <div className="keyword-dialog-list">
              {keywordsLoading ? (
                <div className="my-channel-detail-loading"><Loader2 className="spin" size={16} /> {t('正在加载')}</div>
              ) : disableKeywords.length ? (
                disableKeywords.map((item, index) => {
                  const status = String(item.status || '');
                  const label = status === 'approved' ? t('已生效') : status === 'pending' ? t('待审核') : status === 'rejected' ? t('已拒绝') : status || '-';
                  return (
                    <div className="keyword-dialog-row" key={String(item.id || `${item.keyword}-${index}`)}>
                      <code>{item.keyword}</code>
                      <span className={`keyword-status ${status}`}>{label}</span>
                    </div>
                  );
                })
              ) : (
                <span className="keyword-empty">{t('暂无建议禁用词')}</span>
              )}
            </div>
          </section>
        </div>
      )}
    </section>
  );
}

function ApiAccessView() {
  const { language, t } = useLanguage();
  const [keys, setKeys] = useState<ApiKeyItem[]>([]);
  const [name, setName] = useState('新 API Key');
  const [scopes, setScopes] = useState(scopeOptions.map((scope) => scope.value));
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);

  const load = useCallback(async (fresh = false) => {
    setLoading(true);
    try {
      setKeys(await api<ApiKeyItem[]>('/api/apikeys', { fresh }));
    } catch (error) {
      setNotice({
        type: 'error',
        text: error instanceof Error ? error.message : t('加载 API Key 失败'),
      });
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setName((current) =>
      current === '新 API Key' || current === 'New API Key' ? t('新 API Key') : current,
    );
  }, [language, t]);

  async function createKey(event: FormEvent) {
    event.preventDefault();
    setNotice(null);
    try {
      const data = await api<{ key?: string; item?: ApiKeyItem }>('/api/apikeys', {
        method: 'POST',
        body: { name: name.trim(), scopes: scopes.join(',') },
      });
      setNotice({
        type: 'ok',
        text: data.key
          ? t('创建成功：{{key}}', { key: data.key })
          : t('创建成功，明文仅会显示一次。'),
      });
      await load();
    } catch (error) {
      setNotice({
        type: 'error',
        text: error instanceof Error ? error.message : t('创建失败'),
      });
    }
  }

  function toggleScope(scope: string) {
    setScopes((current) =>
      current.includes(scope)
        ? current.filter((item) => item !== scope)
        : [...current, scope],
    );
  }

  return (
    <section>
      <PageHeading icon={BookOpen} title={t('开放 API')} subtitle={t('管理 Bearer API Key，并查看原站开放接口说明。')} />
      <NoticeBanner notice={notice} />
      <div className="two-column api-layout">
        <article className="panel">
          <div className="panel-title">
            <h2>{t('API 密钥')}</h2>
            <button className="text-button" onClick={() => load(true)} type="button">
              <RefreshCcw size={16} />
              {t('刷新')}
            </button>
          </div>
          {loading ? (
            <div className="loading-block">
              <Loader2 className="spin" />
              {t('正在加载')}
            </div>
          ) : keys.length ? (
            <div className="key-list">
              {keys.map((item) => (
                <div className="key-card" key={item.id}>
                  <div>
                    <strong>{item.name}</strong>
                    <code>{item.prefix}</code>
                  </div>
                  <div className="key-meta">
                    <Badge tone={item.status === 1 ? 'green' : 'red'}>{item.status === 1 ? t('启用') : t('停用')}</Badge>
                    <span>{item.scopes}</span>
                    <span>{t('最近使用：{{date}}', { date: formatDate(item.last_used_at, language) })}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title={t('暂无 API Key')} description={t('可以在右侧创建新的开放 API Key。')} />
          )}
        </article>
        <article className="panel">
          <div className="panel-title">
            <h2>{t('创建 API Key')}</h2>
          </div>
          <form className="form-stack" onSubmit={createKey}>
            <label>
              <span>{t('名称')}</span>
              <input value={name} onChange={(event) => setName(event.target.value)} />
            </label>
            <div className="scope-grid">
              {scopeOptions.map((scope) => (
                <button
                  key={scope.value}
                  className={scopes.includes(scope.value) ? 'scope selected' : 'scope'}
                  onClick={() => toggleScope(scope.value)}
                  type="button"
                >
                  <CheckCircle2 size={16} />
                  {t(scope.label)}
                </button>
              ))}
            </div>
            <button className="primary-button compact" type="submit">
              <Plus size={17} />
              {t('创建密钥')}
            </button>
          </form>
        </article>
      </div>

      <article className="panel docs-panel">
        <div className="panel-title">
          <h2>{t('接口规范')}</h2>
          <Badge tone="blue">Base URL https://gys.oljuxj.xyz/openapi/v1</Badge>
        </div>
        <div className="docs-grid">
          <DocBlock title={t('验证密钥 whoami')} code="GET /openapi/v1/whoami" />
          <DocBlock title={t('获取分类 meta')} code="GET /openapi/v1/meta" />
          <DocBlock title={t('批量上传 apikey')} code="POST /openapi/v1/channels" />
          <DocBlock title={t('分页查询渠道')} code="GET /openapi/v1/channels?page=1&page_size=50" />
        </div>
        <h3>{t('支持分类与 key 格式')}</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>{t('分类')}</th>
                <th>{t('说明')}</th>
                <th>{t('key 格式')}</th>
              </tr>
            </thead>
            <tbody>
              {Object.keys(categoryLabels).slice(0, 12).map((key) => (
                <tr key={key}>
                  <td>
                    <code>{key}</code>
                  </td>
                  <td>{categoryLabel(key, language)}</td>
                  <td>{(language === 'en' ? keyFormatHintsEn : keyFormatHints)[key]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <h3>{t('错误码')}</h3>
        <div className="error-grid">
          {openApiErrors.map(([code, text]) => (
            <div key={code}>
              <code>{code}</code>
              <span>{t(text)}</span>
            </div>
          ))}
        </div>
      </article>
    </section>
  );
}

function DocBlock({ title, code }: { title: string; code: string }) {
  const { t } = useLanguage();

  async function copy() {
    await navigator.clipboard.writeText(code).catch(() => undefined);
  }

  return (
    <div className="doc-block">
      <span>{title}</span>
      <code>{code}</code>
      <button className="icon-button" onClick={copy} type="button" aria-label={t('复制')}>
        <ClipboardCopy size={16} />
      </button>
    </div>
  );
}

function DailyStatsView() {
  const { language, t } = useLanguage();
  const [stats, setStats] = useState<DailyStats | null>(null);
  const [loadingKind, setLoadingKind] = useState<'initial' | 'refresh' | 'realtime' | null>('initial');
  const [error, setError] = useState('');
  const [expandedDates, setExpandedDates] = useState<string[]>([]);
  const [range, setRange] = useState(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 6);
    const format = (date: Date) => date.toISOString().slice(0, 10);
    return { start: format(start), end: format(end) };
  });

  const loading = loadingKind !== null;

  const load = useCallback(async (
    fresh = false,
    kind: 'initial' | 'refresh' | 'realtime' = 'initial',
  ) => {
    setLoadingKind(kind);
    setError('');
    try {
      const params = new URLSearchParams({ start: range.start, end: range.end });
      if (fresh) params.set('refresh', 'true');
      const nextStats = await api<DailyStats>(`/api/stats/daily?${params.toString()}`, { fresh: true });
      setStats(nextStats);
      setExpandedDates([]);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : t('加载每日消费快照失败。'));
    } finally {
      setLoadingKind(null);
    }
  }, [range.end, range.start, t]);

  useEffect(() => {
    load();
  }, [load]);

  const totalQuota = stats?.total_quota || 0;
  const averageQuota = stats?.days?.length ? Math.round(totalQuota / stats.days.length) : 0;
  const maxQuota = Math.max(0, ...(stats?.days || []).map((day) => day.total_quota || day.quota || 0));
  const channelCount = (channels: NonNullable<DailyStats['days']>[number]['channels']) =>
    channels?.filter((channel) => (channel.quota || 0) > 0).length || 0;

  function toggleExpanded(date: string) {
    setExpandedDates((current) => (current.includes(date) ? current.filter((item) => item !== date) : [...current, date]));
  }

  return (
    <section className="daily-stats-page">
      <div className="daily-summary-grid">
        <article className="daily-summary-card">
          <span>{t('区间总消费额度')}</span>
          <strong>{formatInteger(totalQuota)}</strong>
        </article>
        <article className="daily-summary-card">
          <span>{t('区间总消费(约合美元)')}</span>
          <strong>{formatQuota(totalQuota)}</strong>
        </article>
        <article className="daily-summary-card">
          <span>{t('日均消费额度')}</span>
          <strong>{formatInteger(averageQuota)}</strong>
        </article>
      </div>

      {error && <div className="daily-error" role="alert">{error}</div>}

      <div className="daily-stats-toolbar">
        <h1>{t('每日消费快照')}</h1>
        <div className="daily-stats-actions">
          <label className="daily-date-range">
            <input
              aria-label={t('开始日期')}
              max={range.end}
              onChange={(event) => setRange((current) => ({ ...current, start: event.target.value }))}
              type="date"
              value={range.start}
            />
            <span>→</span>
            <input
              aria-label={t('结束日期')}
              min={range.start}
              onChange={(event) => setRange((current) => ({ ...current, end: event.target.value }))}
              type="date"
              value={range.end}
            />
          </label>
          <button
            className={`daily-refresh-button ${loadingKind === 'refresh' ? 'is-loading' : ''}`}
            disabled={loading}
            onClick={() => load(false, 'refresh')}
            type="button"
          >
            <RefreshCcw className={loadingKind === 'refresh' ? 'spin' : ''} size={15} />
            {t('刷新')}
          </button>
          <button
            className={`daily-realtime-button ${loadingKind === 'realtime' ? 'is-loading' : ''}`}
            disabled={loading}
            onClick={() => load(true, 'realtime')}
            type="button"
          >
            <RefreshCcw className={loadingKind === 'realtime' ? 'spin' : ''} size={15} />
            {t('刷新今日实时')}
          </button>
        </div>
      </div>

      <div className="daily-table-wrap">
        <table className="daily-table">
          <thead>
            <tr>
              <th className="daily-expand-heading" aria-label={t('展开')} />
              <th>{t('日期')}</th>
              <th>{t('当日消费额度')}</th>
              <th>{t('约合美元')}</th>
              <th>{t('占比')}</th>
              <th>{t('涉及渠道数')}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="daily-table-empty" colSpan={6}>
                  <Loader2 className="spin" size={22} />
                  {t('正在加载快照')}
                </td>
              </tr>
            ) : stats?.days?.length ? (
              stats.days.map((day) => {
                const quota = day.total_quota || day.quota || 0;
                const share = maxQuota ? Math.round((quota / maxQuota) * 100) : 0;
                const expanded = expandedDates.includes(day.date);
                return (
                  <Fragment key={day.date}>
                    <tr>
                      <td className="daily-expand-cell">
                        <button
                          aria-expanded={expanded}
                          aria-label={t('展开 {{date}} 的渠道明细', { date: day.date })}
                          className={expanded ? 'expanded' : ''}
                          disabled={!day.channels?.length}
                          onClick={() => toggleExpanded(day.date)}
                          type="button"
                        >
                          <ChevronRight size={16} />
                        </button>
                      </td>
                      <td><strong>{day.date}</strong></td>
                      <td className={quota > 0 ? 'daily-quota' : ''}>{formatInteger(quota)}</td>
                      <td>{formatQuota(quota)}</td>
                      <td>
                        <span className="daily-share-track"><span style={{ width: `${share}%` }} /></span>
                      </td>
                      <td>{channelCount(day.channels)}</td>
                    </tr>
                    {expanded && (
                      <tr className="daily-detail-row">
                        <td colSpan={6}>
                          {day.channels?.length ? (
                            <table className="daily-channel-table">
                              <thead>
                                <tr>
                                  <th>{t('渠道名称')}</th>
                                  <th>{t('分类')}</th>
                                  <th>{t('消费额度')}</th>
                                  <th>{t('约合美元')}</th>
                                </tr>
                              </thead>
                              <tbody>
                                {[...day.channels]
                                  .sort((left, right) => (right.quota || 0) - (left.quota || 0))
                                  .map((channel, index) => (
                                    <tr key={channel.id || `${channel.channel_name}-${index}`}>
                                      <td>{channel.channel_name || '-'}</td>
                                      <td>{categoryLabel(channel.category || '', language) || '-'}</td>
                                      <td className={channel.quota ? 'daily-quota' : ''}>{formatInteger(channel.quota || 0)}</td>
                                      <td>{formatQuota(channel.quota || 0)}</td>
                                    </tr>
                                  ))}
                              </tbody>
                            </table>
                          ) : (
                            <span className="daily-detail-empty">{t('暂无涉及渠道。')}</span>
                          )}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })
            ) : (
              <tr>
                <td className="daily-table-empty" colSpan={6}>
                  <Database size={28} />
                  <span>{t('暂无数据')}</span>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function ModelGapsView() {
  const { t } = useLanguage();
  const [items, setItems] = useState<ModelGap[]>([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<Notice | null>(null);

  const load = useCallback(async (fresh = false) => {
    setLoading(true);
    setNotice(null);
    try {
      setItems(await api<ModelGap[]>('/api/model-gaps', { fresh }));
    } catch (error) {
      setNotice({
        type: 'error',
        text: error instanceof Error ? error.message : t('加载模型缺口失败'),
      });
    } finally {
      setLoading(false);
    }
  }, [t]);

  async function copyReport() {
    const report = [
      t('模型缺口提醒'),
      ...items.map(
        (item) =>
          `${item.platform_type_name} ${item.model_name}: RPM ${formatInteger(item.gap_rpm)}, TPM ${formatInteger(item.gap_tpm_est)}`,
      ),
    ].join('\n');
    await navigator.clipboard.writeText(report).catch(() => undefined);
    setNotice({ type: 'ok', text: t('已复制缺口通知。') });
  }

  useEffect(() => {
    load();
  }, [load]);

  return (
    <section>
      <PageHeading
        icon={Zap}
        title={t('模型缺口')}
        subtitle={t('供应缺口提醒来自原站模型缺口接口。')}
        action={
          <div className="action-row model-gap-actions">
            <button className="ghost-button" onClick={copyReport} type="button">
              <ClipboardCopy size={17} />
              {t('复制通知')}
            </button>
            <button className="primary-button compact" onClick={() => load(true)} type="button">
              <RefreshCcw size={17} />
              {t('刷新')}
            </button>
          </div>
        }
      />
      <NoticeBanner notice={notice} />
      <div className="panel">
        {loading ? (
          <div className="loading-block">
            <Loader2 className="spin" />
            {t('正在加载模型缺口')}
          </div>
        ) : items.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>{t('平台类型')}</th>
                  <th>{t('模型')}</th>
                  <th>{t('RPM 缺口')}</th>
                  <th>{t('TPM 估算')}</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={`${item.platform_type}-${item.model_name}`}>
                    <td>
                      <Badge tone={item.platform_type_name.toLowerCase().includes('aws') ? 'orange' : 'purple'}>
                        {item.platform_type_name}
                      </Badge>
                    </td>
                    <td>
                      <code>{item.model_name}</code>
                    </td>
                    <td>
                      <strong>{formatInteger(item.gap_rpm)}</strong>
                    </td>
                    <td>{formatInteger(item.gap_tpm_est)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState title={t('暂无缺口')} description={t('目前没有模型缺口提醒。')} />
        )}
      </div>
    </section>
  );
}

function SubAccountsView() {
  const { language, t } = useLanguage();
  const [items, setItems] = useState<SubAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<Notice | null>(null);

  const load = useCallback(async (fresh = false) => {
    setLoading(true);
    setNotice(null);
    try {
      const data = await api<{ items: SubAccount[] }>('/api/sub-accounts', { fresh });
      setItems(data.items || []);
    } catch (error) {
      setNotice({
        type: 'warn',
        text: error instanceof Error ? error.message : t('当前账号无权限管理子账号'),
      });
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <section>
      <PageHeading
        icon={Users}
        title={t('子账号管理')}
        subtitle={t('原站仅供应商主账号可管理子账号；当前登录账号会显示权限结果。')}
        action={
          <button className="primary-button compact" onClick={() => load(true)} type="button">
            <RefreshCcw size={17} />
            {t('刷新')}
          </button>
        }
      />
      <NoticeBanner notice={notice} />
      <div className="panel">
        {loading ? (
          <div className="loading-block">
            <Loader2 className="spin" />
            {t('正在检查权限')}
          </div>
        ) : items.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>{t('用户名')}</th>
                  <th>{t('显示名')}</th>
                  <th>{t('渠道数')}</th>
                  <th>{t('已用额度')}</th>
                  <th>{t('状态')}</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td>{item.id}</td>
                    <td>{item.username}</td>
                    <td>{item.display_name || '-'}</td>
                    <td>{item.channel_count || 0}</td>
                    <td>{formatQuota(item.used_quota)}</td>
                    <td>
                      <Badge tone={item.status === 1 ? 'green' : 'red'}>{statusLabel(item.status, language)}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState title={t('不可管理子账号')} description={t('原站返回当前账号没有供应商主账号权限。')} />
        )}
      </div>
    </section>
  );
}

function ViewRenderer({
  view,
  setView,
}: {
  view: ViewKey;
  setView: (view: ViewKey) => void;
}) {
  if (view === 'upload') return <UploadView />;
  if (view === 'my-channels') return <MyChannelsView />;
  if (view === 'api-access') return <ApiAccessView />;
  if (view === 'sub-accounts') return <SubAccountsView />;
  if (view === 'daily-stats') return <DailyStatsView />;
  if (view === 'model-gaps') return <ModelGapsView />;
  return <DashboardView setView={setView} />;
}

function SupplierApplication() {
  const { t } = useLanguage();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeView, setActiveView] = useState<ViewKey>('dashboard');
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    setActiveView(viewFromPath(window.location.pathname));
    const onPop = () => setActiveView(viewFromPath(window.location.pathname));
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  useEffect(() => {
    const cachedUser = readCachedUser();
    if (cachedUser) {
      setUser(cachedUser);
      setAuthLoading(false);
    }

    api<UserProfile>('/api/auth/profile', { fresh: true })
      .then((nextUser) => {
        cacheUser(nextUser);
        setUser(nextUser);
      })
      .catch(() => {
        if (authRedirectPending) return;
        clearCachedUser();
        setUser(null);
      })
      .finally(() => {
        if (!authRedirectPending) setAuthLoading(false);
      });
  }, []);

  async function logout() {
    if (isLoggingOut) return;

    setIsLoggingOut(true);
    try {
      await api('/api/auth/logout', { method: 'POST' }).catch(() => undefined);
      clearCachedUser();
      setUser(null);
      window.history.pushState({}, '', '/login');
    } finally {
      setIsLoggingOut(false);
    }
  }

  if (authLoading) {
    return (
      <main className="loading-screen">
        <Loader2 className="spin" size={30} />
        <span>{t('正在验证登录状态')}</span>
      </main>
    );
  }

  if (!user) {
    return (
      <LoginScreen
        onLogin={(nextUser) => {
          cacheUser(nextUser);
          setUser(nextUser);
          setActiveView('dashboard');
          window.history.pushState({}, '', '/dashboard');
        }}
      />
    );
  }

  return (
    <Shell
      user={user}
      activeView={activeView}
      setActiveView={setActiveView}
      onLogout={logout}
      isLoggingOut={isLoggingOut}
    >
      <ViewRenderer
        view={activeView}
        setView={(view) => {
          setActiveView(view);
          window.history.pushState({}, '', `/${view}`);
        }}
      />
    </Shell>
  );
}

export default function SupplierApp() {
  return (
    <LanguageProvider>
      <SupplierApplication />
    </LanguageProvider>
  );
}
