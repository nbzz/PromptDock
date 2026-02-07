import 'server-only';

import { TemplateRecord, TemplateTagRecord, TemplateVersionRecord } from '@/lib/types';

// 预留：模板市场数据结构（当前功能不在页面展示）
export interface TemplateMarketSchema {
  templates: TemplateRecord[];
  templateVersions: TemplateVersionRecord[];
  templateTags: TemplateTagRecord[];
  templateTagRelations: Array<{
    templateId: string;
    tagId: string;
  }>;
}

export const templateMarketPlaceholder: TemplateMarketSchema = {
  templates: [],
  templateVersions: [],
  templateTags: [],
  templateTagRelations: []
};
