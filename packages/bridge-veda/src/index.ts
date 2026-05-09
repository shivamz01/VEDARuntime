import { HANDOFF_SCHEMA_VERSION, PRODUCT_VERSION } from '@veda-runtime-v1/shared';

export interface VedaBridgeManifest {
  product_version: typeof PRODUCT_VERSION;
  handoff_schema_version: typeof HANDOFF_SCHEMA_VERSION;
  source_repo_path: string;
  mutates_source_repo: false;
  supported_exports: string[];
}

export function getVedaBridgeManifest(sourceRepoPath = 'E:\\VEDA-DEPS\\VEDA-OS-INFRA-workspace'): VedaBridgeManifest {
  return {
    product_version: PRODUCT_VERSION,
    handoff_schema_version: HANDOFF_SCHEMA_VERSION,
    source_repo_path: sourceRepoPath,
    mutates_source_repo: false,
    supported_exports: [
      'handoff_schema',
      'agent_manifest',
      'runtime_status',
      'pipeline_template_manifest'
    ]
  };
}
