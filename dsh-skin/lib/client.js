// dsh-skin browser bundle. 设置 → 通用 →「个性化外观」展开行：
// 亮/暗切换 + 15 套预设皮肤 + 字号（小/中/大/特大，覆盖组合令牌与硬编码界面文字）+
// 「自定义样式」折叠区（13 个颜色角色，取色器 + HEX 输入，默认收起）。
// 选择经 localStorage 持久化（第三方命名空间无法通过 settings RPC 写入），
// 重启后自动恢复；界面控件（输入框/气泡/侧栏/按钮/tab）颜色由派生令牌联动。
window.__ModuleLoader__.load({
  id: 'dsh-skin',
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;
    Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
    var React = require('react');

    var TOKENS = {
      brand: '--dsw-alias-brand-primary',
      base: '--dsw-alias-bg-base',
      layer1: '--dsw-alias-bg-layer-1',
      layer2: '--dsw-alias-bg-layer-2',
      overlay: '--dsw-alias-bg-overlay',
      sidebar: '--dsw-specific-sidebar-fill',
      label1: '--dsw-alias-label-primary',
      label2: '--dsw-alias-label-secondary',
      border1: '--dsw-alias-border-l1',
      border2: '--dsw-alias-border-l2',
      error: '--dsw-alias-state-error-primary',
      success: '--dsw-alias-state-success-primary',
      warn: '--dsw-alias-state-warn-primary'
    };

    // ── 15 套预设：13 个令牌全部定制，亮/暗各一套，色调区分明显 ──────────
    var PRESETS = {
      ocean: {
        name: '海盐蓝',
        tokens: {
          '--dsw-alias-bg-base': { light: '#f2f6fc', dark: '#0a1220' },
          '--dsw-alias-bg-layer-1': { light: '#ffffff', dark: '#101b30' },
          '--dsw-alias-bg-layer-2': { light: '#e9eff9', dark: '#16233c' },
          '--dsw-alias-bg-overlay': { light: '#ffffff', dark: '#141f36' },
          '--dsw-alias-border-l1': { light: '#d8e2f0', dark: '#1f2f4e' },
          '--dsw-alias-border-l2': { light: '#bccde6', dark: '#2b4066' },
          '--dsw-alias-brand-primary': { light: '#2563eb', dark: '#4f8df9' },
          '--dsw-alias-label-primary': { light: '#0f1d3d', dark: '#e6edfb' },
          '--dsw-alias-label-secondary': { light: '#5b6b8c', dark: '#9fb1d4' },
          '--dsw-specific-sidebar-fill': { light: '#eaf1fb', dark: '#0c1526' },
          '--dsw-alias-state-error-primary': { light: '#dc2626', dark: '#f87171' },
          '--dsw-alias-state-success-primary': { light: '#16a34a', dark: '#4ade80' },
          '--dsw-alias-state-warn-primary': { light: '#d97706', dark: '#fbbf24' }
        }
      },
      mint: {
        name: '薄荷绿',
        tokens: {
          '--dsw-alias-bg-base': { light: '#f1faf4', dark: '#07140e' },
          '--dsw-alias-bg-layer-1': { light: '#ffffff', dark: '#0d2018' },
          '--dsw-alias-bg-layer-2': { light: '#e3f5ea', dark: '#142b20' },
          '--dsw-alias-bg-overlay': { light: '#ffffff', dark: '#11241c' },
          '--dsw-alias-border-l1': { light: '#cfe9d8', dark: '#1d3a2c' },
          '--dsw-alias-border-l2': { light: '#aedac1', dark: '#27513d' },
          '--dsw-alias-brand-primary': { light: '#059669', dark: '#34d399' },
          '--dsw-alias-label-primary': { light: '#0b2b1d', dark: '#d9f5e5' },
          '--dsw-alias-label-secondary': { light: '#4d7a63', dark: '#8fc4a8' },
          '--dsw-specific-sidebar-fill': { light: '#e6f6ec', dark: '#081a12' },
          '--dsw-alias-state-error-primary': { light: '#dc2626', dark: '#f87171' },
          '--dsw-alias-state-success-primary': { light: '#059669', dark: '#34d399' },
          '--dsw-alias-state-warn-primary': { light: '#d97706', dark: '#fbbf24' }
        }
      },
      night: {
        name: '薰衣草紫',
        tokens: {
          '--dsw-alias-bg-base': { light: '#f6f4fb', dark: '#120e1e' },
          '--dsw-alias-bg-layer-1': { light: '#ffffff', dark: '#1a1530' },
          '--dsw-alias-bg-layer-2': { light: '#efeaf8', dark: '#221b3d' },
          '--dsw-alias-bg-overlay': { light: '#ffffff', dark: '#1e1838' },
          '--dsw-alias-border-l1': { light: '#e0d9f0', dark: '#2c2450' },
          '--dsw-alias-border-l2': { light: '#c9bde6', dark: '#3a2f66' },
          '--dsw-alias-brand-primary': { light: '#8b5cf6', dark: '#a78bfa' },
          '--dsw-alias-label-primary': { light: '#1e1638', dark: '#ece6fb' },
          '--dsw-alias-label-secondary': { light: '#6b5f8f', dark: '#a89cd0' },
          '--dsw-specific-sidebar-fill': { light: '#f0ecfa', dark: '#150f26' },
          '--dsw-alias-state-error-primary': { light: '#dc2626', dark: '#f87171' },
          '--dsw-alias-state-success-primary': { light: '#16a34a', dark: '#4ade80' },
          '--dsw-alias-state-warn-primary': { light: '#d97706', dark: '#fbbf24' }
        }
      },
      // 撞色/拼色预设（下架暂存，后续重新设计后再启用）：
      /*
      duo_sunsea: {
        name: '蓝黄撞色',
        highlight: '#f5c518',
        tokens: {
          '--dsw-alias-bg-base': { light: '#eef3fb', dark: '#0b1530' },
          '--dsw-alias-bg-layer-1': { light: '#ffffff', dark: '#111d40' },
          '--dsw-alias-bg-layer-2': { light: '#dfe9f8', dark: '#19274f' },
          '--dsw-alias-bg-overlay': { light: '#ffffff', dark: '#152150' },
          '--dsw-alias-border-l1': { light: '#c9d7ee', dark: '#24376b' },
          '--dsw-alias-border-l2': { light: '#a9bedf', dark: '#304783' },
          '--dsw-alias-brand-primary': { light: '#1e50c8', dark: '#4f7df0' },
          '--dsw-alias-label-primary': { light: '#0c1c40', dark: '#e4ebfa' },
          '--dsw-alias-label-secondary': { light: '#4f628f', dark: '#9db1db' },
          '--dsw-specific-sidebar-fill': { light: '#e3ecf9', dark: '#0d1836' },
          '--dsw-alias-state-error-primary': { light: '#dc2626', dark: '#f87171' },
          '--dsw-alias-state-success-primary': { light: '#16a34a', dark: '#4ade80' },
          '--dsw-alias-state-warn-primary': { light: '#f5c518', dark: '#facc15' }
        }
      },
      duo_ember: {
        name: '红橙活力',
        highlight: '#e0453a',
        tokens: {
          '--dsw-alias-bg-base': { light: '#fdf3ec', dark: '#201008' },
          '--dsw-alias-bg-layer-1': { light: '#ffffff', dark: '#2c1809' },
          '--dsw-alias-bg-layer-2': { light: '#f9e4d3', dark: '#38200d' },
          '--dsw-alias-bg-overlay': { light: '#ffffff', dark: '#331b0b' },
          '--dsw-alias-border-l1': { light: '#f2d6c0', dark: '#4d2c16' },
          '--dsw-alias-border-l2': { light: '#e7bb9a', dark: '#653a1e' },
          '--dsw-alias-brand-primary': { light: '#e8590c', dark: '#fb923c' },
          '--dsw-alias-label-primary': { light: '#34180a', dark: '#fdeadd' },
          '--dsw-alias-label-secondary': { light: '#8c5f42', dark: '#d4a184' },
          '--dsw-specific-sidebar-fill': { light: '#fbeadc', dark: '#251408' },
          '--dsw-alias-state-error-primary': { light: '#c92a2a', dark: '#f87171' },
          '--dsw-alias-state-success-primary': { light: '#16a34a', dark: '#4ade80' },
          '--dsw-alias-state-warn-primary': { light: '#d97706', dark: '#fbbf24' }
        }
      },
      duo_royal: {
        name: '紫金高雅',
        highlight: '#d4a017',
        tokens: {
          '--dsw-alias-bg-base': { light: '#f3f0fb', dark: '#150f28' },
          '--dsw-alias-bg-layer-1': { light: '#ffffff', dark: '#1e1738' },
          '--dsw-alias-bg-layer-2': { light: '#e9e2f7', dark: '#282048' },
          '--dsw-alias-bg-overlay': { light: '#ffffff', dark: '#231b42' },
          '--dsw-alias-border-l1': { light: '#dcd2f0', dark: '#362a5e' },
          '--dsw-alias-border-l2': { light: '#c5b5e6', dark: '#473878' },
          '--dsw-alias-brand-primary': { light: '#6d3fd8', dark: '#9775fa' },
          '--dsw-alias-label-primary': { light: '#1d1440', dark: '#eee8fb' },
          '--dsw-alias-label-secondary': { light: '#6d5f99', dark: '#aca0d6' },
          '--dsw-specific-sidebar-fill': { light: '#eae3f9', dark: '#181130' },
          '--dsw-alias-state-error-primary': { light: '#dc2626', dark: '#f87171' },
          '--dsw-alias-state-success-primary': { light: '#16a34a', dark: '#4ade80' },
          '--dsw-alias-state-warn-primary': { light: '#d4a017', dark: '#eab308' }
        }
      },
      duo_mintcoral: {
        name: '青粉撞色',
        highlight: '#ec4899',
        tokens: {
          '--dsw-alias-bg-base': { light: '#effaf4', dark: '#07130f' },
          '--dsw-alias-bg-layer-1': { light: '#ffffff', dark: '#0d2018' },
          '--dsw-alias-bg-layer-2': { light: '#ddf3e8', dark: '#142b20' },
          '--dsw-alias-bg-overlay': { light: '#ffffff', dark: '#11241c' },
          '--dsw-alias-border-l1': { light: '#c9ecdc', dark: '#1d3a2e' },
          '--dsw-alias-border-l2': { light: '#a3dfc6', dark: '#27513f' },
          '--dsw-alias-brand-primary': { light: '#0ca678', dark: '#2fd8a6' },
          '--dsw-alias-label-primary': { light: '#092b1e', dark: '#d9f5e9' },
          '--dsw-alias-label-secondary': { light: '#4a7a64', dark: '#8cc4ac' },
          '--dsw-specific-sidebar-fill': { light: '#e4f7ed', dark: '#081a12' },
          '--dsw-alias-state-error-primary': { light: '#e11d48', dark: '#fb7185' },
          '--dsw-alias-state-success-primary': { light: '#0ca678', dark: '#2fd8a6' },
          '--dsw-alias-state-warn-primary': { light: '#ec4899', dark: '#f9a8d4' }
        }
      },
      */
      sunset: {
        name: '暖阳橙',
        tokens: {
          '--dsw-alias-bg-base': { light: '#fdf7f1', dark: '#1d120a' },
          '--dsw-alias-bg-layer-1': { light: '#ffffff', dark: '#29180c' },
          '--dsw-alias-bg-layer-2': { light: '#f9ecdd', dark: '#33200f' },
          '--dsw-alias-bg-overlay': { light: '#ffffff', dark: '#2d1c0e' },
          '--dsw-alias-border-l1': { light: '#f2dfcc', dark: '#46291a' },
          '--dsw-alias-border-l2': { light: '#e7c8ab', dark: '#5b3a24' },
          '--dsw-alias-brand-primary': { light: '#ea580c', dark: '#fb923c' },
          '--dsw-alias-label-primary': { light: '#331a08', dark: '#fde8d5' },
          '--dsw-alias-label-secondary': { light: '#8a6240', dark: '#d0a583' },
          '--dsw-specific-sidebar-fill': { light: '#fbf0e5', dark: '#201209' },
          '--dsw-alias-state-error-primary': { light: '#dc2626', dark: '#f87171' },
          '--dsw-alias-state-success-primary': { light: '#16a34a', dark: '#4ade80' },
          '--dsw-alias-state-warn-primary': { light: '#ea580c', dark: '#fb923c' }
        }
      },
      sakura: {
        name: '樱花粉',
        tokens: {
          '--dsw-alias-bg-base': { light: '#fdf5f8', dark: '#1e0f16' },
          '--dsw-alias-bg-layer-1': { light: '#ffffff', dark: '#2a1520' },
          '--dsw-alias-bg-layer-2': { light: '#fbe9f0', dark: '#351c28' },
          '--dsw-alias-bg-overlay': { light: '#ffffff', dark: '#2f1923' },
          '--dsw-alias-border-l1': { light: '#f5dbe6', dark: '#462338' },
          '--dsw-alias-border-l2': { light: '#eec2d5', dark: '#59304a' },
          '--dsw-alias-brand-primary': { light: '#db2777', dark: '#f472b6' },
          '--dsw-alias-label-primary': { light: '#33101f', dark: '#fde4ee' },
          '--dsw-alias-label-secondary': { light: '#8a5a6d', dark: '#cf9fb2' },
          '--dsw-specific-sidebar-fill': { light: '#fbeff4', dark: '#221018' },
          '--dsw-alias-state-error-primary': { light: '#dc2626', dark: '#f87171' },
          '--dsw-alias-state-success-primary': { light: '#16a34a', dark: '#4ade80' },
          '--dsw-alias-state-warn-primary': { light: '#d97706', dark: '#fbbf24' }
        }
      },
      mocha: {
        name: '摩卡棕',
        tokens: {
          '--dsw-alias-bg-base': { light: '#faf6f1', dark: '#17100a' },
          '--dsw-alias-bg-layer-1': { light: '#ffffff', dark: '#201610' },
          '--dsw-alias-bg-layer-2': { light: '#f1e7db', dark: '#2a1d15' },
          '--dsw-alias-bg-overlay': { light: '#ffffff', dark: '#251a12' },
          '--dsw-alias-border-l1': { light: '#e6d9c8', dark: '#3a2a1e' },
          '--dsw-alias-border-l2': { light: '#d6c3aa', dark: '#4d3828' },
          '--dsw-alias-brand-primary': { light: '#92400e', dark: '#f59e0b' },
          '--dsw-alias-label-primary': { light: '#2c1d10', dark: '#f7ead9' },
          '--dsw-alias-label-secondary': { light: '#7d664d', dark: '#c8ab8a' },
          '--dsw-specific-sidebar-fill': { light: '#f6eee4', dark: '#1a110a' },
          '--dsw-alias-state-error-primary': { light: '#dc2626', dark: '#f87171' },
          '--dsw-alias-state-success-primary': { light: '#16a34a', dark: '#4ade80' },
          '--dsw-alias-state-warn-primary': { light: '#d97706', dark: '#fbbf24' }
        }
      },
      forest: {
        name: '森林绿',
        tokens: {
          '--dsw-alias-bg-base': { light: '#f4faf5', dark: '#07120a' },
          '--dsw-alias-bg-layer-1': { light: '#ffffff', dark: '#0d1f13' },
          '--dsw-alias-bg-layer-2': { light: '#e6f3ea', dark: '#142b1b' },
          '--dsw-alias-bg-overlay': { light: '#ffffff', dark: '#11241a' },
          '--dsw-alias-border-l1': { light: '#d4e8da', dark: '#1e3b28' },
          '--dsw-alias-border-l2': { light: '#b6d6c0', dark: '#2b543a' },
          '--dsw-alias-brand-primary': { light: '#15803d', dark: '#4ade80' },
          '--dsw-alias-label-primary': { light: '#0c2817', dark: '#ddf5e6' },
          '--dsw-alias-label-secondary': { light: '#55705f', dark: '#9cc2ab' },
          '--dsw-specific-sidebar-fill': { light: '#eaf5ee', dark: '#09160d' },
          '--dsw-alias-state-error-primary': { light: '#dc2626', dark: '#f87171' },
          '--dsw-alias-state-success-primary': { light: '#15803d', dark: '#4ade80' },
          '--dsw-alias-state-warn-primary': { light: '#d97706', dark: '#fbbf24' }
        }
      },
      sky: {
        name: '天际青',
        tokens: {
          '--dsw-alias-bg-base': { light: '#f2fafd', dark: '#06141c' },
          '--dsw-alias-bg-layer-1': { light: '#ffffff', dark: '#0c1e29' },
          '--dsw-alias-bg-layer-2': { light: '#e3f3fa', dark: '#132a38' },
          '--dsw-alias-bg-overlay': { light: '#ffffff', dark: '#102531' },
          '--dsw-alias-border-l1': { light: '#cfe7f2', dark: '#1d3a4a' },
          '--dsw-alias-border-l2': { light: '#aed5e8', dark: '#2a5166' },
          '--dsw-alias-brand-primary': { light: '#0284c7', dark: '#38bdf8' },
          '--dsw-alias-label-primary': { light: '#082c3d', dark: '#d9f0fb' },
          '--dsw-alias-label-secondary': { light: '#4d7183', dark: '#8dbdd1' },
          '--dsw-specific-sidebar-fill': { light: '#e8f6fb', dark: '#081821' },
          '--dsw-alias-state-error-primary': { light: '#dc2626', dark: '#f87171' },
          '--dsw-alias-state-success-primary': { light: '#16a34a', dark: '#4ade80' },
          '--dsw-alias-state-warn-primary': { light: '#d97706', dark: '#fbbf24' }
        }
      },
      berry: {
        name: '莓果红',
        tokens: {
          '--dsw-alias-bg-base': { light: '#fdf4f6', dark: '#170b0f' },
          '--dsw-alias-bg-layer-1': { light: '#ffffff', dark: '#201218' },
          '--dsw-alias-bg-layer-2': { light: '#f9e3e8', dark: '#291a21' },
          '--dsw-alias-bg-overlay': { light: '#ffffff', dark: '#24161c' },
          '--dsw-alias-border-l1': { light: '#f0d3da', dark: '#3a2330' },
          '--dsw-alias-border-l2': { light: '#e4b4c0', dark: '#4d2f3e' },
          '--dsw-alias-brand-primary': { light: '#be123c', dark: '#fb7185' },
          '--dsw-alias-label-primary': { light: '#2e0d17', dark: '#fde3e8' },
          '--dsw-alias-label-secondary': { light: '#7c4a58', dark: '#c69aa6' },
          '--dsw-specific-sidebar-fill': { light: '#fbeef1', dark: '#1a0d12' },
          '--dsw-alias-state-error-primary': { light: '#be123c', dark: '#fb7185' },
          '--dsw-alias-state-success-primary': { light: '#16a34a', dark: '#4ade80' },
          '--dsw-alias-state-warn-primary': { light: '#d97706', dark: '#fbbf24' }
        }
      },
      cream: {
        name: '奶油米',
        tokens: {
          '--dsw-alias-bg-base': { light: '#fdf9f2', dark: '#191207' },
          '--dsw-alias-bg-layer-1': { light: '#ffffff', dark: '#23190c' },
          '--dsw-alias-bg-layer-2': { light: '#f7ecdc', dark: '#2d2011' },
          '--dsw-alias-bg-overlay': { light: '#ffffff', dark: '#281d0f' },
          '--dsw-alias-border-l1': { light: '#ecdfc9', dark: '#3d2e1c' },
          '--dsw-alias-border-l2': { light: '#ddc9a9', dark: '#51402a' },
          '--dsw-alias-brand-primary': { light: '#b45309', dark: '#f59e0b' },
          '--dsw-alias-label-primary': { light: '#2b1e0a', dark: '#f7ecd9' },
          '--dsw-alias-label-secondary': { light: '#7c6848', dark: '#c4ab84' },
          '--dsw-specific-sidebar-fill': { light: '#faf2e4', dark: '#1c1408' },
          '--dsw-alias-state-error-primary': { light: '#dc2626', dark: '#f87171' },
          '--dsw-alias-state-success-primary': { light: '#16a34a', dark: '#4ade80' },
          '--dsw-alias-state-warn-primary': { light: '#b45309', dark: '#f59e0b' }
        }
      },
      aurora: {
        name: '极光青',
        tokens: {
          '--dsw-alias-bg-base': { light: '#f0faf9', dark: '#04120f' },
          '--dsw-alias-bg-layer-1': { light: '#ffffff', dark: '#0a1d19' },
          '--dsw-alias-bg-layer-2': { light: '#ddf3f0', dark: '#122b26' },
          '--dsw-alias-bg-overlay': { light: '#ffffff', dark: '#0e2621' },
          '--dsw-alias-border-l1': { light: '#c2e8e3', dark: '#1d3f38' },
          '--dsw-alias-border-l2': { light: '#9cd6cf', dark: '#2a584f' },
          '--dsw-alias-brand-primary': { light: '#0d9488', dark: '#2dd4bf' },
          '--dsw-alias-label-primary': { light: '#062e28', dark: '#d8f5f0' },
          '--dsw-alias-label-secondary': { light: '#4d7d75', dark: '#8fc4ba' },
          '--dsw-specific-sidebar-fill': { light: '#e6f6f4', dark: '#061712' },
          '--dsw-alias-state-error-primary': { light: '#dc2626', dark: '#f87171' },
          '--dsw-alias-state-success-primary': { light: '#0d9488', dark: '#2dd4bf' },
          '--dsw-alias-state-warn-primary': { light: '#d97706', dark: '#fbbf24' }
        }
      },
      obsidian: {
        name: '石墨灰',
        tokens: {
          '--dsw-alias-bg-base': { light: '#fafafa', dark: '#09090b' },
          '--dsw-alias-bg-layer-1': { light: '#ffffff', dark: '#101013' },
          '--dsw-alias-bg-layer-2': { light: '#f0f0f2', dark: '#17171b' },
          '--dsw-alias-bg-overlay': { light: '#ffffff', dark: '#141418' },
          '--dsw-alias-border-l1': { light: '#e4e4e7', dark: '#232329' },
          '--dsw-alias-border-l2': { light: '#d4d4d8', dark: '#2f2f37' },
          '--dsw-alias-brand-primary': { light: '#4f46e5', dark: '#818cf8' },
          '--dsw-alias-label-primary': { light: '#18181b', dark: '#ededf0' },
          '--dsw-alias-label-secondary': { light: '#71717a', dark: '#a1a1aa' },
          '--dsw-specific-sidebar-fill': { light: '#f4f4f5', dark: '#0c0c0f' },
          '--dsw-alias-state-error-primary': { light: '#dc2626', dark: '#f87171' },
          '--dsw-alias-state-success-primary': { light: '#16a34a', dark: '#4ade80' },
          '--dsw-alias-state-warn-primary': { light: '#d97706', dark: '#fbbf24' }
        }
      },
      salt: {
        name: '海盐白',
        tokens: {
          '--dsw-alias-bg-base': { light: '#f8fafc', dark: '#0b1220' },
          '--dsw-alias-bg-layer-1': { light: '#ffffff', dark: '#101a2e' },
          '--dsw-alias-bg-layer-2': { light: '#eef2f7', dark: '#17233b' },
          '--dsw-alias-bg-overlay': { light: '#ffffff', dark: '#141f33' },
          '--dsw-alias-border-l1': { light: '#e2e8f0', dark: '#22304c' },
          '--dsw-alias-border-l2': { light: '#cbd5e1', dark: '#2f4266' },
          '--dsw-alias-brand-primary': { light: '#475569', dark: '#94a3b8' },
          '--dsw-alias-label-primary': { light: '#0f172a', dark: '#e2e8f0' },
          '--dsw-alias-label-secondary': { light: '#64748b', dark: '#94a3b8' },
          '--dsw-specific-sidebar-fill': { light: '#f1f5f9', dark: '#0d1526' },
          '--dsw-alias-state-error-primary': { light: '#dc2626', dark: '#f87171' },
          '--dsw-alias-state-success-primary': { light: '#16a34a', dark: '#4ade80' },
          '--dsw-alias-state-warn-primary': { light: '#d97706', dark: '#fbbf24' }
        }
      },
      lemon: {
        name: '柠檬黄',
        tokens: {
          '--dsw-alias-bg-base': { light: '#fdfbf3', dark: '#141205' },
          '--dsw-alias-bg-layer-1': { light: '#ffffff', dark: '#1e1a08' },
          '--dsw-alias-bg-layer-2': { light: '#f8f2d8', dark: '#29230d' },
          '--dsw-alias-bg-overlay': { light: '#ffffff', dark: '#231e0b' },
          '--dsw-alias-border-l1': { light: '#ece2b8', dark: '#3a3315' },
          '--dsw-alias-border-l2': { light: '#dccf94', dark: '#4e4520' },
          '--dsw-alias-brand-primary': { light: '#a16207', dark: '#facc15' },
          '--dsw-alias-label-primary': { light: '#2b2407', dark: '#faf2cf' },
          '--dsw-alias-label-secondary': { light: '#7a6e3a', dark: '#c7b878' },
          '--dsw-specific-sidebar-fill': { light: '#faf6e4', dark: '#171405' },
          '--dsw-alias-state-error-primary': { light: '#dc2626', dark: '#f87171' },
          '--dsw-alias-state-success-primary': { light: '#16a34a', dark: '#4ade80' },
          '--dsw-alias-state-warn-primary': { light: '#a16207', dark: '#facc15' }
        }
      },
      coral: {
        name: '珊瑚红',
        tokens: {
          '--dsw-alias-bg-base': { light: '#fdf5f4', dark: '#180a0d' },
          '--dsw-alias-bg-layer-1': { light: '#ffffff', dark: '#221017' },
          '--dsw-alias-bg-layer-2': { light: '#fae7e4', dark: '#2d1920' },
          '--dsw-alias-bg-overlay': { light: '#ffffff', dark: '#271319' },
          '--dsw-alias-border-l1': { light: '#f3d5d0', dark: '#3d242d' },
          '--dsw-alias-border-l2': { light: '#e9b5ad', dark: '#50303b' },
          '--dsw-alias-brand-primary': { light: '#e11d48', dark: '#fb7185' },
          '--dsw-alias-label-primary': { light: '#330e16', dark: '#fde8ec' },
          '--dsw-alias-label-secondary': { light: '#8a4d58', dark: '#cfa0aa' },
          '--dsw-specific-sidebar-fill': { light: '#fbf0ee', dark: '#1b0c10' },
          '--dsw-alias-state-error-primary': { light: '#e11d48', dark: '#fb7185' },
          '--dsw-alias-state-success-primary': { light: '#16a34a', dark: '#4ade80' },
          '--dsw-alias-state-warn-primary': { light: '#d97706', dark: '#fbbf24' }
        }
      }
    };

    // ── 13 个颜色角色，分组展示 ─────────────────────────────────────────────
    var CUSTOM_GROUPS = [
      { name: '基础', fields: [
        { key: 'base', label: '背景色' },
        { key: 'layer1', label: '卡片背景' },
        { key: 'layer2', label: '嵌套卡片' },
        { key: 'overlay', label: '浮层背景' },
        { key: 'sidebar', label: '侧栏背景' }
      ] },
      { name: '文字', fields: [
        { key: 'label1', label: '主文字' },
        { key: 'label2', label: '次要文字' }
      ] },
      { name: '边框', fields: [
        { key: 'border1', label: '边框（细）' },
        { key: 'border2', label: '边框（粗）' }
      ] },
      { name: '强调与状态', fields: [
        { key: 'brand', label: '主题色' },
        { key: 'error', label: '错误色' },
        { key: 'success', label: '成功色' },
        { key: 'warn', label: '警告色' }
      ] }
    ];

    var DEFAULT_CUSTOM = {
      base: '#f4f4f5', layer1: '#ffffff', layer2: '#ececee', overlay: '#ffffff',
      sidebar: '#eceef2', label1: '#18181b', label2: '#6e6e76',
      border1: '#d9d9de', border2: '#c4c4ca', brand: '#2563eb',
      error: '#dc2626', success: '#16a34a', warn: '#d97706'
    };

    // ── 字号：覆盖组件实际消费的组合令牌，加 !important 确保优先 ──────────
    var FONT_VARS = {
      '--dsw-font-markdown-base': '16px/28px var(--dsw-font-family)',
      '--dsw-font-markdown-base-strong': '600 16px/28px var(--dsw-font-family)',
      '--dsw-font-markdown-small': '14px/24px var(--dsw-font-family)',
      '--dsw-font-markdown-table': '15px/25px var(--dsw-font-family)',
      '--dsw-font-markdown-table-head': '500 15px/25px var(--dsw-font-family)',
      '--dsw-font-markdown-code': '14px/22px var(--ds-font-family-code)',
      '--dsw-font-markdown-code-block': '13px/22px var(--ds-font-family-code)',
      '--dsw-font-markdown-h1': '700 24px/34px var(--dsw-font-family)',
      '--dsw-font-markdown-h2': '700 22px/32px var(--dsw-font-family)',
      '--dsw-font-markdown-h3': '700 20px/30px var(--dsw-font-family)',
      '--dsw-font-markdown-h4': '600 16px/28px var(--dsw-font-family)',
      '--dsw-font-l-20': '500 20px/28px var(--dsw-font-family)',
      '--dsw-font-base-16': '16px/24px var(--dsw-font-family)',
      '--dsw-font-s-14': '14px/22px var(--dsw-font-family)',
      '--dsw-font-s-strong-14': '500 14px/22px var(--dsw-font-family)',
      '--dsw-font-xs-13': '13px/20px var(--dsw-font-family)',
      '--dsw-font-xs-strong-13': '500 13px/20px var(--dsw-font-family)',
      '--dsw-font-xxs-12': '12px/18px var(--dsw-font-family)',
      '--dsw-font-xxxs-11': '11px/14px var(--dsw-font-family)',
      '--dsw-font-markdown-code-block-small': '12px/18px var(--ds-font-family-code)'
    };
    function scaleFont(def, k) {
      var m = def.match(/^(?:([0-9.]+)\s+)?([0-9.]+)px\/([0-9.]+)px\s+(.+)$/);
      if (!m) return def;
      var weight = m[1] !== undefined ? m[1] + ' ' : '';
      var size = Math.round(parseFloat(m[2]) * k);
      var lh = Math.round(parseFloat(m[3]) * k);
      return weight + size + 'px/' + lh + 'px ' + m[4];
    }
    var FONT_SCALES = { default: 1, s: 0.8, l: 1.25, xl: 1.5 };
    var FONT_LABELS = { s: '小', default: '中（默认）', l: '大', xl: '特大' };

    // 预设展示顺序：白/灰/黑 → 红 → 橙 → 黄 → 绿 → 青 → 蓝 → 紫
    // （撞色/拼色预设已下架暂存：duo_sunsea 蓝黄、duo_ember 红橙、duo_royal 紫金、duo_mintcoral 青粉，代码注释保留在 PRESETS 中，后续重新设计）
    var PRESET_ORDER = ['salt', 'obsidian', 'berry', 'coral', 'sakura', 'sunset', 'mocha', 'cream', 'lemon', 'mint', 'forest', 'aurora', 'sky', 'ocean', 'night'];

    var UI_CSS = [
      '.dshskin-rowwrap{border:1px solid var(--dsw-alias-border-l1);border-radius:12px;padding:10px 12px;background:var(--dsw-alias-bg-layer-1)}',
      '.dshskin-head{display:flex;align-items:center;justify-content:space-between;width:100%;border:none;background:none;color:var(--dsw-alias-label-primary);cursor:pointer;font:inherit;font-size:14px;padding:2px 0}',
      '.dshskin-head:hover{color:var(--dsw-alias-brand-primary)}',
      '.dshskin-chevron{transition:transform .15s;color:var(--dsw-alias-label-secondary);font-size:12px}',
      '.dshskin-chevron.dshskin-open{transform:rotate(90deg)}',
      '.dshskin-body{display:flex;flex-direction:column;gap:12px;margin-top:10px;padding-top:10px;border-top:1px solid var(--dsw-alias-border-l1)}',
      '.dshskin-title{font-weight:600;font-size:12px;color:var(--dsw-alias-label-secondary)}',
      '.dshskin-seg{display:flex;gap:6px;background:var(--dsw-alias-bg-layer-2);border:1px solid var(--dsw-alias-border-l1);border-radius:8px;padding:3px}',
      '.dshskin-seg-btn{flex:1;border:none;background:transparent;color:var(--dsw-alias-label-secondary);border-radius:6px;padding:5px 8px;cursor:pointer;font:inherit;font-size:12px}',
      '.dshskin-seg-btn:hover{color:var(--dsw-alias-label-primary)}',
      '.dshskin-seg-btn.dshskin-active{background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);box-shadow:0 0 0 1px var(--dsw-alias-border-l2)}',
      '.dshskin-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(92px,1fr));gap:6px}',
      '.dshskin-card{display:flex;flex-direction:column;gap:5px;border:1px solid var(--dsw-alias-border-l1);border-radius:8px;padding:8px;background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary);cursor:pointer;font:inherit;font-size:12px;text-align:left}',
      '.dshskin-card:hover{border-color:var(--dsw-alias-border-l2)}',
      '.dshskin-card.dshskin-active{border-color:var(--dsw-alias-brand-primary);box-shadow:0 0 0 1px var(--dsw-alias-brand-primary)}',
      '.dshskin-chips{display:flex;gap:3px}',
      '.dshskin-chip{width:14px;height:14px;border-radius:3px;border:1px solid rgba(0,0,0,.18)}',
      '.dshskin-fontrow{display:flex;gap:6px}',
      '.dshskin-fontbtn{border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary);border-radius:7px;padding:4px 12px;cursor:pointer;font:inherit;font-size:12px}',
      '.dshskin-fontbtn:hover{border-color:var(--dsw-alias-border-l2)}',
      '.dshskin-fontbtn.dshskin-active{border-color:var(--dsw-alias-brand-primary);box-shadow:0 0 0 1px var(--dsw-alias-brand-primary)}',
      '.dshskin-collapse{display:flex;align-items:center;gap:6px;width:100%;border:none;background:none;color:var(--dsw-alias-label-primary);cursor:pointer;font:inherit;font-size:13px;font-weight:600;padding:2px 0;text-align:left}',
      '.dshskin-collapse:hover{color:var(--dsw-alias-brand-primary)}',
      '.dshskin-carrow{transition:transform .15s;display:inline-block;color:var(--dsw-alias-label-secondary);font-size:11px}',
      '.dshskin-carrow.dshskin-open{transform:rotate(90deg)}',
      '.dshskin-cbody{display:flex;flex-direction:column;gap:10px;margin-top:8px}',
      '.dshskin-group{border-top:1px dashed var(--dsw-alias-border-l1);padding-top:8px}',
      '.dshskin-groupname{font-weight:500;font-size:12px;color:var(--dsw-alias-label-secondary);margin-bottom:6px}',
      '.dshskin-field{display:flex;align-items:center;gap:8px;margin-bottom:6px}',
      '.dshskin-fieldlabel{flex:none;width:88px;color:var(--dsw-alias-label-primary);font-size:12px}',
      '.dshskin-hexinput{flex:1;min-width:0;border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary);border-radius:6px;padding:4px 8px;font:inherit;font-size:12px;font-family:monospace}',
      '.dshskin-hexinput:focus{outline:none;border-color:var(--dsw-alias-brand-primary)}',
      '.dshskin-input{flex:none;width:34px;height:26px;padding:0;border:1px solid var(--dsw-alias-border-l2);border-radius:6px;background:transparent;cursor:pointer}',
      '.dshskin-saved{color:var(--dsw-alias-label-secondary);font-size:12px}',
      '.dshskin-reset{align-self:flex-start;border:1px solid var(--dsw-alias-border-l2);border-radius:7px;padding:5px 12px;background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary);cursor:pointer;font:inherit;font-size:12px}',
      '.dshskin-reset:hover{border-color:var(--dsw-alias-state-error-primary);color:var(--dsw-alias-state-error-primary)}'
    ].join('\n');
    if (typeof document !== 'undefined' && document.querySelector('style[data-plugin-css="dsh-skin/ui"]') === null) {
      var uiTag = document.createElement('style');
      uiTag.dataset.plugin = 'dsh-skin';
      uiTag.dataset.pluginCss = 'dsh-skin/ui';
      uiTag.textContent = UI_CSS;
      document.head.appendChild(uiTag);
    }

    // ── 持久化：localStorage（参考 dsh-ui-appearance：第三方命名空间无法通过
    // settings RPC 写入，网关只开放产品内置命名空间；localStorage 跨刷新/重启保留）──
    var STORAGE_KEY = 'dsh-skin.settings';
    function loadState() {
      try {
        var raw = localStorage.getItem(STORAGE_KEY);
        if (raw === null) return null;
        var parsed = JSON.parse(raw);
        if (parsed === null || typeof parsed !== 'object') return null;
        // 脏数据校验：预设/字号不存在时回退默认（防止下架预设导致插件崩溃）
        var preset = parsed.preset;
        if (preset !== 'default' && preset !== 'custom' && !Object.prototype.hasOwnProperty.call(PRESETS, preset)) preset = 'default';
        var font = FONT_LABELS[parsed.font] !== undefined ? parsed.font : 'default';
        var custom = {};
        for (var k in DEFAULT_CUSTOM) {
          if (Object.prototype.hasOwnProperty.call(DEFAULT_CUSTOM, k)) {
            var v = parsed.custom !== undefined ? parsed.custom[k] : undefined;
            custom[k] = (typeof v === 'string' && /^#[0-9a-fA-F]{6}$/.test(v)) ? v : DEFAULT_CUSTOM[k];
          }
        }
        return { preset: preset, font: font, custom: custom };
      } catch (e) {
        return null;
      }
    }
    function saveState(state) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch (e) { /* 存储不可用：保持会话内生效 */ }
    }

    function apply(ctx) {
      var theme = ctx.get('theme');
      var slots = ctx.get('slots');

      var SOURCE = 'dsh-skin';
      var disposer = null;
      var state = loadState();
      if (state === null) {
        state = { preset: 'default', font: 'default', custom: Object.assign({}, DEFAULT_CUSTOM) };
      }

      function resetTokens() {
        if (disposer) { disposer(); disposer = null; }
        clearDerivedCss();
      }
      // 当前生效的某个颜色角色的值（按亮/暗模式取）
      function currentTokenValue(key) {
        if (theme === undefined) return undefined;
        var scheme = theme.getTheme().active.colorScheme;
        if (state.preset === 'custom') return state.custom[key];
        if (state.preset !== 'default' && PRESETS[state.preset] !== undefined && TOKENS[key] !== undefined) {
          var t = PRESETS[state.preset].tokens[TOKENS[key]];
          if (t !== undefined) return t[scheme];
        }
        return undefined;
      }
      // 界面控件令牌：用 inline style + !important 直接写 html/body（与字号同机制，必生效）
      function applyDerivedCss() {
        if (typeof document === 'undefined') return;
        var els = [];
        if (document.documentElement) els.push(document.documentElement);
        if (document.body) els.push(document.body);
        var layer1 = currentTokenValue('layer1');
        var layer2 = currentTokenValue('layer2');
        var base = currentTokenValue('base');
        var brand = currentTokenValue('brand');
        // 细节色（气泡高亮等小面积点缀）：撞色预设用 highlight，其余跟随品牌色
        var highlight = brand;
        if (state.preset !== 'custom' && PRESETS[state.preset] !== undefined && PRESETS[state.preset].highlight !== undefined) {
          highlight = PRESETS[state.preset].highlight;
        }
        var scheme = theme !== undefined ? theme.getTheme().active.colorScheme : 'light';
        for (var i = 0; i < els.length; i++) {
          var el = els[i];
          // 输入框背景跟随卡片色
          if (layer1 !== undefined) el.style.setProperty('--dsw-specific-input-major', layer1, 'important');
          else el.style.removeProperty('--dsw-specific-input-major');
          if (layer1 !== undefined) el.style.setProperty('--dsw-specific-login-input', layer1, 'important');
          else el.style.removeProperty('--dsw-specific-login-input');
          // 对话框（聊天气泡）：品牌色 10% 混入卡片色 → 有色彩感的浅色调
          if (brand !== undefined && layer1 !== undefined) {
            el.style.setProperty('--dsw-specific-bubble', 'color-mix(in srgb, ' + brand + ' 10%, ' + layer1 + ')', 'important');
          } else {
            el.style.removeProperty('--dsw-specific-bubble');
          }
          if (highlight !== undefined) el.style.setProperty('--dsw-specific-bubble-highlight', highlight, 'important');
          else el.style.removeProperty('--dsw-specific-bubble-highlight');
          // 灰色控件跟随卡片色（输入框加号 / goal 条）；新会话框用主色，与侧栏明显区分
          if (layer2 !== undefined) {
            el.style.setProperty('--dsw-specific-selector', layer2, 'important');
            el.style.setProperty('--dsw-specific-tip', layer2, 'important');
          } else {
            el.style.removeProperty('--dsw-specific-selector');
            el.style.removeProperty('--dsw-specific-tip');
          }
          // 新会话框：浅主色底（主色 20% 混入卡片色），配深色字清晰可读
          if (brand !== undefined && layer1 !== undefined) {
            el.style.setProperty('--dsw-alias-button-elevated-fill', 'color-mix(in srgb, ' + brand + ' 20%, ' + layer1 + ')', 'important');
          } else {
            el.style.removeProperty('--dsw-alias-button-elevated-fill');
          }
          // "Deep diving..." 状态渐变跟随主题色
          if (brand !== undefined) {
            // 主按钮（composer 开始/暂停圆形按钮）
            el.style.setProperty('--dsw-alias-button-info-fill', brand, 'important');
            el.style.setProperty('--dsw-alias-button-info-hover', brand, 'important');
            el.style.setProperty('--dsw-alias-button-primary-hover', brand, 'important');
            // 「对话/轨迹」tab 激活色与业务状态色
            el.style.setProperty('--dsw-alias-state-business-primary', brand, 'important');
            // "Deep diving..." 状态渐变跟随主题色
            el.style.setProperty('--dsw-static-deepseek-500', brand, 'important');
            el.style.setProperty('--dsw-static-deepseek-200', brand, 'important');
          } else {
            el.style.removeProperty('--dsw-alias-button-info-fill');
            el.style.removeProperty('--dsw-alias-button-info-hover');
            el.style.removeProperty('--dsw-alias-button-primary-hover');
            el.style.removeProperty('--dsw-alias-state-business-primary');
            el.style.removeProperty('--dsw-static-deepseek-500');
            el.style.removeProperty('--dsw-static-deepseek-200');
          }
          // 对话区主背景：预设模式生效；自定义模式尊重用户自己调的颜色，不覆写。
          if (state.preset !== 'custom' && layer1 !== undefined && base !== undefined) {
            if (scheme === 'dark') {
              // 深色模式：轻微降饱和 + 提亮（少量中性灰），与侧栏保持层次但不突兀
              el.style.setProperty('--dsw-alias-bg-base', 'color-mix(in srgb, ' + base + ' 92%, #8f9098 8%)', 'important');
            } else {
              // 亮色模式：稍微浅一点点（layer1 混入 base）
              el.style.setProperty('--dsw-alias-bg-base', 'color-mix(in srgb, ' + layer1 + ' 35%, ' + base + ')', 'important');
            }
          } else {
            el.style.removeProperty('--dsw-alias-bg-base');
          }
        }
      }
      function clearDerivedCss() {
        if (typeof document === 'undefined') return;
        var els = [];
        if (document.documentElement) els.push(document.documentElement);
        if (document.body) els.push(document.body);
        for (var i = 0; i < els.length; i++) {
          els[i].style.removeProperty('--dsw-specific-input-major');
          els[i].style.removeProperty('--dsw-specific-login-input');
          els[i].style.removeProperty('--dsw-specific-bubble');
          els[i].style.removeProperty('--dsw-specific-bubble-highlight');
          els[i].style.removeProperty('--dsw-static-deepseek-500');
          els[i].style.removeProperty('--dsw-static-deepseek-200');
          els[i].style.removeProperty('--dsw-alias-button-info-fill');
          els[i].style.removeProperty('--dsw-alias-button-info-hover');
          els[i].style.removeProperty('--dsw-alias-button-primary-hover');
          els[i].style.removeProperty('--dsw-alias-state-business-primary');
          els[i].style.removeProperty('--dsw-specific-selector');
          els[i].style.removeProperty('--dsw-specific-tip');
          els[i].style.removeProperty('--dsw-alias-button-elevated-fill');
          els[i].style.removeProperty('--dsw-alias-bg-base');
        }
      }
      function applyTokens(tokens) {
        if (theme === undefined) return;
        // 派生令牌：换肤时让界面控件也跟着变
        // - 输入框背景（--dsw-specific-input-major）跟随卡片背景
        // - "Deep diving..." 状态渐变（--dsw-static-deepseek-500/200）跟随主题色
        var derived = {};
        for (var name in tokens) {
          if (Object.prototype.hasOwnProperty.call(tokens, name)) derived[name] = tokens[name];
        }
        if (derived['--dsw-alias-bg-layer-1'] !== undefined) {
          derived['--dsw-specific-input-major'] = derived['--dsw-alias-bg-layer-1'];
        }
        if (derived['--dsw-alias-brand-primary'] !== undefined) {
          derived['--dsw-static-deepseek-500'] = derived['--dsw-alias-brand-primary'];
          derived['--dsw-static-deepseek-200'] = derived['--dsw-alias-brand-primary'];
        }
        disposer = theme.overrideTokens(SOURCE, derived);
        applyDerivedCss(); // 双保险：inline !important 直接写界面控件令牌
      }
      function applyPreset(id) {
        // 先更新 state.preset 再应用：applyDerivedCss 读 state 取色，
        // 顺序反了会用上一组预设的颜色（切换不及时的根因）
        state.preset = id;
        if (id === 'default') resetTokens();
        else applyTokens(PRESETS[id].tokens);
        saveState(state);
      }
      // 进入自定义模式：仅当用户还没微调过任何颜色时，才用当前预设的亮色值作起点；
      // 已有自定义颜色（含 settings 里存过的）一律保留，不被预设覆盖。
      function customIsDefault() {
        for (var gi = 0; gi < CUSTOM_GROUPS.length; gi++) {
          var g = CUSTOM_GROUPS[gi];
          for (var fi = 0; fi < g.fields.length; fi++) {
            var f = g.fields[fi];
            if (state.custom[f.key] !== DEFAULT_CUSTOM[f.key]) return false;
          }
        }
        return true;
      }
      function enterCustom() {
        if (state.preset !== 'custom') {
          if (state.preset !== 'default' && PRESETS[state.preset] && customIsDefault()) {
            var t = PRESETS[state.preset].tokens;
            for (var gi = 0; gi < CUSTOM_GROUPS.length; gi++) {
              var g = CUSTOM_GROUPS[gi];
              for (var fi = 0; fi < g.fields.length; fi++) {
                var f = g.fields[fi];
                state.custom[f.key] = t[TOKENS[f.key]].light;
              }
            }
          }
          state.preset = 'custom';
        }
      }
      function applyCustom() {
        var tokens = {};
        for (var gi = 0; gi < CUSTOM_GROUPS.length; gi++) {
          var g = CUSTOM_GROUPS[gi];
          for (var fi = 0; fi < g.fields.length; fi++) {
            var f = g.fields[fi];
            tokens[TOKENS[f.key]] = { light: state.custom[f.key], dark: state.custom[f.key] };
          }
        }
        applyTokens(tokens);
        saveState(state);
      }
      function setCustomField(key, value) {
        enterCustom();
        state.custom[key] = value;
        applyCustom();
      }
      function applyFont() {
        if (typeof document === 'undefined') return;
        var k = FONT_SCALES[state.font] || 1;
        var els = [];
        if (document.documentElement) els.push(document.documentElement);
        if (document.body) els.push(document.body);
        for (var e = 0; e < els.length; e++) {
          var el = els[e];
          for (var name in FONT_VARS) {
            if (Object.prototype.hasOwnProperty.call(FONT_VARS, name)) {
              if (k === 1) el.style.removeProperty(name);
              else el.style.setProperty(name, scaleFont(FONT_VARS[name], k), 'important');
            }
          }
        }
        // 官方硬编码字号的界面文字（输入框、user 气泡），用动态样式跟随字号。
        // 类名哈希随 DSH 版本可能变化：失效时静默回退官方默认值。
        var tag = document.getElementById('dshskin-font-input');
        if (k !== 1) {
          if (tag === null) {
            tag = document.createElement('style');
            tag.id = 'dshskin-font-input';
            document.head.appendChild(tag);
          }
          var sz = Math.round(16 * k);
          var lh = Math.round(24 * k);
          var ssz = Math.round(14 * k); // 侧栏基准字号（原 14px）
          var slh = Math.round(20 * k);
          tag.textContent = '.uV2eYG_card{font-size:' + sz + 'px !important;line-height:' + lh + 'px !important}' +
            '.uV2eYG_input{font-size:' + sz + 'px !important;line-height:' + lh + 'px !important}' +
            '.gdEzaW_bubble{font-size:' + sz + 'px !important;line-height:' + lh + 'px !important}' +
            // 侧栏列全部文字（新会话/文件夹/文件名/设置等，含其他包渲染的元素）
            '.pI_x6G_sidebarCol,.pI_x6G_sidebarCol *{font-size:' + ssz + 'px !important;line-height:' + slh + 'px !important}';
        } else if (tag !== null) {
          tag.remove();
        }
      }
      function setFont(scale) {
        state.font = scale;
        applyFont();
        saveState(state);
      }
      function resetSkin() {
        resetTokens();
        state.font = 'default';
        applyFont();
        state.preset = 'default';
        state.custom = Object.assign({}, DEFAULT_CUSTOM); // 恢复默认同时清空自定义色
        saveState(state);
      }

      // 从 localStorage 恢复（同步，无需等待）
      function restoreState() {
        if (state.preset === 'custom') {
          var tokens = {};
          for (var gi = 0; gi < CUSTOM_GROUPS.length; gi++) {
            var g = CUSTOM_GROUPS[gi];
            for (var fi = 0; fi < g.fields.length; fi++) {
              var f = g.fields[fi];
              tokens[TOKENS[f.key]] = { light: state.custom[f.key], dark: state.custom[f.key] };
            }
          }
          applyTokens(tokens);
        } else if (state.preset !== 'default') {
          applyTokens(PRESETS[state.preset].tokens);
        } else {
          resetTokens();
        }
        applyFont();
      }
      restoreState();
      // 亮暗切换 / 主题变化时重算界面控件令牌（气泡、输入框、对话区背景按新 scheme 更新）
      ctx.effect(function () {
        var off = ctx.on('theme/change', function () {
          applyDerivedCss();
        });
        return off;
      }, 'dsh-skin: scheme sync');

      ctx.effect(function () {
        return function () {
          resetTokens();
          state.font = 'default';
          applyFont();
        };
      });

      function AppearanceRow() {
        var openState = React.useState(false);
        var open = openState[0];
        var setOpen = openState[1];
        var customOpenState = React.useState(false);
        var customOpen = customOpenState[0];
        var setCustomOpen = customOpenState[1];
        var tick = React.useState({});
        var setTick = tick[1];
        var textState = React.useState({});
        var texts = textState[0];
        var setTexts = textState[1];
        var active = state.preset;
        var font = state.font;
        var mode = theme !== undefined ? theme.getTheme().preference : 'light';
        var savedName = active === 'default' ? '默认' : (active === 'custom' ? '自定义' : (PRESETS[active] ? PRESETS[active].name : active));
        var savedLabel = savedName + ' · 字号' + FONT_LABELS[font];
        var rerender = function () { setTick({}); };

        var seg = React.createElement('div', { className: 'dshskin-seg' },
          React.createElement('button', { key: 'light', className: 'dshskin-seg-btn' + (mode === 'light' ? ' dshskin-active' : ''), onClick: function () { if (theme !== undefined) theme.setTheme('light'); rerender(); } }, '亮色'),
          React.createElement('button', { key: 'dark', className: 'dshskin-seg-btn' + (mode === 'dark' ? ' dshskin-active' : ''), onClick: function () { if (theme !== undefined) theme.setTheme('dark'); rerender(); } }, '暗色'),
          React.createElement('button', { key: 'system', className: 'dshskin-seg-btn' + (mode === 'system' ? ' dshskin-active' : ''), onClick: function () { if (theme !== undefined) theme.setTheme('system'); rerender(); } }, '跟随系统')
        );

        var cards = [React.createElement('button', {
          key: 'default',
          className: 'dshskin-card' + (active === 'default' ? ' dshskin-active' : ''),
          onClick: function () { applyPreset('default'); rerender(); }
        },
          React.createElement('div', null, '默认'),
          React.createElement('div', { className: 'dshskin-chips' },
            React.createElement('span', { className: 'dshskin-chip', style: { background: '#f4f4f5' } }),
            React.createElement('span', { className: 'dshskin-chip', style: { background: '#ffffff' } }),
            React.createElement('span', { className: 'dshskin-chip', style: { background: '#2563eb' } }),
            React.createElement('span', { className: 'dshskin-chip', style: { background: '#18181b' } })
          )
        )];
        var presetIds = PRESET_ORDER;
        for (var p = 0; p < presetIds.length; p++) {
          var pid = presetIds[p];
          var pr = PRESETS[pid];
          var tk = pr.tokens;
          cards.push(React.createElement('button', {
            key: pid,
            className: 'dshskin-card' + (active === pid ? ' dshskin-active' : ''),
            onClick: function (id) { return function () { applyPreset(id); rerender(); }; }(pid)
          },
            React.createElement('div', null, pr.name),
            React.createElement('div', { className: 'dshskin-chips' },
              React.createElement('span', { className: 'dshskin-chip', style: { background: tk['--dsw-alias-bg-base'].light } }),
              React.createElement('span', { className: 'dshskin-chip', style: { background: tk['--dsw-alias-bg-layer-1'].light } }),
              React.createElement('span', { className: 'dshskin-chip', style: { background: tk['--dsw-alias-brand-primary'].light } }),
              React.createElement('span', { className: 'dshskin-chip', style: { background: tk['--dsw-alias-label-primary'].light } })
            )
          ));
        }

        var fontBtns = [];
        var fontKeys = Object.keys(FONT_LABELS);
        for (var fb = 0; fb < fontKeys.length; fb++) {
          var fk = fontKeys[fb];
          fontBtns.push(React.createElement('button', {
            key: fk,
            className: 'dshskin-fontbtn' + (font === fk ? ' dshskin-active' : ''),
            onClick: function (key) { return function () { setFont(key); rerender(); }; }(fk)
          }, FONT_LABELS[fk]));
        }

        // 「自定义样式」折叠区
        var groupEls = [];
        for (var g = 0; g < CUSTOM_GROUPS.length; g++) {
          var grp = CUSTOM_GROUPS[g];
          var fieldEls = [];
          for (var f = 0; f < grp.fields.length; f++) {
            var field = grp.fields[f];
            (function (field) {
              var commit = function (raw) {
                if (/^#[0-9a-fA-F]{6}$/.test(raw)) {
                  setCustomField(field.key, raw);
                }
                var next = {};
                for (var k in texts) if (Object.prototype.hasOwnProperty.call(texts, k) && k !== field.key) next[k] = texts[k];
                setTexts(next);
                rerender();
              };
              fieldEls.push(React.createElement('div', { key: field.key, className: 'dshskin-field' },
                React.createElement('span', { className: 'dshskin-fieldlabel' }, field.label),
                React.createElement('input', {
                  type: 'text',
                  className: 'dshskin-hexinput',
                  value: texts[field.key] !== undefined ? texts[field.key] : state.custom[field.key],
                  spellCheck: false,
                  onChange: function (ev) {
                    var next = {};
                    for (var k in texts) if (Object.prototype.hasOwnProperty.call(texts, k)) next[k] = texts[k];
                    next[field.key] = ev.target.value;
                    setTexts(next);
                  },
                  onBlur: function (ev) { commit(ev.target.value); },
                  onKeyDown: function (ev) { if (ev.key === 'Enter') ev.target.blur(); }
                }),
                React.createElement('input', {
                  type: 'color',
                  className: 'dshskin-input',
                  value: state.custom[field.key],
                  onChange: function (ev) { setCustomField(field.key, ev.target.value); rerender(); }
                })
              ));
            })(field);
          }
          groupEls.push(React.createElement('div', { key: grp.name, className: 'dshskin-group' },
            React.createElement('div', { className: 'dshskin-groupname' }, grp.name),
            ...fieldEls
          ));
        }

        var customSection = React.createElement('div', null,
          React.createElement('button', {
            className: 'dshskin-collapse',
            onClick: function () { setCustomOpen(!customOpen); }
          },
            React.createElement('span', { className: 'dshskin-carrow' + (customOpen ? ' dshskin-open' : '') }, '▶'),
            React.createElement('span', null, '自定义样式')
          ),
          customOpen ? React.createElement('div', { className: 'dshskin-cbody' },
            React.createElement('div', { className: 'dshskin-title' }, '颜色微调（从当前预设继承，同时作用于亮/暗模式）'),
            ...groupEls
          ) : null
        );

        var body = open ? React.createElement('div', { className: 'dshskin-body' },
          React.createElement('div', { className: 'dshskin-saved' }, '已保存外观：' + savedLabel),
          React.createElement('div', { className: 'dshskin-title' }, '显示模式'),
          seg,
          React.createElement('div', { className: 'dshskin-title' }, '预设皮肤'),
          React.createElement('div', { className: 'dshskin-grid' }, ...cards),
          React.createElement('div', { className: 'dshskin-title' }, '字号'),
          React.createElement('div', { className: 'dshskin-fontrow' }, ...fontBtns),
          customSection,
          React.createElement('button', {
            className: 'dshskin-reset',
            onClick: function () { resetSkin(); rerender(); }
          }, '恢复默认')
        ) : null;

        return React.createElement('div', { className: 'dshskin-rowwrap' },
          React.createElement('button', {
            className: 'dshskin-head',
            onClick: function () { setOpen(!open); }
          },
            React.createElement('span', null, '个性化外观'),
            React.createElement('span', { className: 'dshskin-chevron' + (open ? ' dshskin-open' : '') }, '▶')
          ),
          body
        );
      }

      slots.inject('settings.general.item', function () {
        return slots.register(
          { name: 'settings.general.item', id: 'dsh-skin', order: 15 },
          function () { return React.createElement(AppearanceRow); }
        );
      });
    }

    exports.apply = apply;
    // theme 必须是硬依赖：恢复逻辑在 apply 时同步执行，theme 未就绪会静默失效
    exports.inject = ['slots', 'theme'];
    return module.exports;
  }
});
