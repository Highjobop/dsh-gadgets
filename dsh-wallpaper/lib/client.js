// dsh-wallpaper browser bundle. 设置 → 通用 →「壁纸背景」展开行：
// 开关 + 图片（URL 或本地文件，自动降采样为 dataURL）+ 透明度 + 模糊 + 恢复默认。
// 经 localStorage 持久化（第三方命名空间无法通过 settings RPC 写入，网关白名单限制），
// 重启后自动恢复。原理：全屏 fixed 层（z-index:-1）垫底 + 把对话区主背景
// （--dsw-alias-bg-base）覆写为 transparent，让壁纸从内容区透出。
window.__ModuleLoader__.load({
  id: 'dsh-wallpaper',
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;
    Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
    var React = require('react');

    var STORAGE_KEY = 'dsh-wallpaper.settings';
    var DEFAULTS = { enabled: false, url: '', opacity: 0.4, blur: 0 };

    function loadState() {
      try {
        var raw = localStorage.getItem(STORAGE_KEY);
        if (raw === null) return null;
        var p = JSON.parse(raw);
        if (p === null || typeof p !== 'object') return null;
        var state = {};
        for (var k in DEFAULTS) {
          if (!Object.prototype.hasOwnProperty.call(DEFAULTS, k)) continue;
          state[k] = p[k] !== undefined ? p[k] : DEFAULTS[k];
        }
        state.enabled = !!state.enabled;
        state.opacity = Math.min(1, Math.max(0, Number(state.opacity) || 0));
        state.blur = Math.min(40, Math.max(0, Number(state.blur) || 0));
        if (typeof state.url !== 'string') state.url = '';
        return state;
      } catch (e) {
        return null;
      }
    }
    function saveState(state) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch (e) {
        // 存储不可用（dataURL 超配额等）：保持会话内生效
      }
    }

    var WP_CSS = [
      // 壁纸层：垫底、不挡交互
      '#dsw-wallpaper{position:fixed;inset:0;z-index:-1;background-size:cover;background-position:center;background-repeat:no-repeat;pointer-events:none}',
      // 页面与对话区主背景透明，让壁纸透出（inline !important 覆写 --dsw-alias-bg-base 见 apply）
      'html.dsw-wallpaper-on,html.dsw-wallpaper-on body{background:transparent !important}',
      // 设置行 UI
      '.dswp-rowwrap{border:1px solid var(--dsw-alias-border-l1);border-radius:12px;padding:10px 12px;background:var(--dsw-alias-bg-layer-1)}',
      '.dswp-head{display:flex;align-items:center;justify-content:space-between;width:100%;border:none;background:none;color:var(--dsw-alias-label-primary);cursor:pointer;font:inherit;font-size:14px;padding:2px 0}',
      '.dswp-head:hover{color:var(--dsw-alias-brand-primary)}',
      '.dswp-chevron{transition:transform .15s;color:var(--dsw-alias-label-secondary);font-size:12px}',
      '.dswp-chevron.dswp-open{transform:rotate(90deg)}',
      '.dswp-body{display:flex;flex-direction:column;gap:12px;margin-top:10px;padding-top:10px;border-top:1px solid var(--dsw-alias-border-l1)}',
      '.dswp-title{font-weight:600;font-size:12px;color:var(--dsw-alias-label-secondary)}',
      '.dswp-toggle{display:flex;align-items:center;gap:8px}',
      '.dswp-toggle input{width:16px;height:16px;cursor:pointer}',
      '.dswp-url{display:flex;gap:6px}',
      '.dswp-input{flex:1;min-width:0;border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary);border-radius:6px;padding:5px 8px;font:inherit;font-size:12px}',
      '.dswp-input:focus{outline:none;border-color:var(--dsw-alias-brand-primary)}',
      '.dswp-filebtn,.dswp-reset{border:1px solid var(--dsw-alias-border-l2);border-radius:7px;padding:5px 12px;background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary);cursor:pointer;font:inherit;font-size:12px;white-space:nowrap}',
      '.dswp-filebtn:hover{border-color:var(--dsw-alias-brand-primary)}',
      '.dswp-reset:hover{border-color:var(--dsw-alias-state-error-primary);color:var(--dsw-alias-state-error-primary)}',
      '.dswp-slider{display:flex;align-items:center;gap:8px}',
      '.dswp-slider input[type=range]{flex:1;min-width:0;accent-color:var(--dsw-alias-brand-primary)}',
      '.dswp-slider span{flex:none;width:64px;text-align:right;color:var(--dsw-alias-label-secondary);font-size:12px;font-family:monospace}',
      '.dswp-preview{width:100%;height:72px;border:1px solid var(--dsw-alias-border-l1);border-radius:8px;background-size:cover;background-position:center}',
      '.dswp-hint{color:var(--dsw-alias-label-secondary);font-size:12px;line-height:1.6}'
    ].join('\n');
    if (typeof document !== 'undefined' && document.querySelector('style[data-plugin-css="dsh-wallpaper/ui"]') === null) {
      var uiTag = document.createElement('style');
      uiTag.dataset.plugin = 'dsh-wallpaper';
      uiTag.dataset.pluginCss = 'dsh-wallpaper/ui';
      uiTag.textContent = WP_CSS;
      document.head.appendChild(uiTag);
    }

    function getWallpaperEl() {
      return document.getElementById('dsw-wallpaper');
    }
    function ensureWallpaperEl() {
      var el = getWallpaperEl();
      if (el === null) {
        el = document.createElement('div');
        el.id = 'dsw-wallpaper';
        document.body.appendChild(el);
      }
      return el;
    }

    // 应用主框架（#root > [data-slot=root] > div）硬编码了白色背景（CSS-in-JS 注入，
    // 非变量），必须内联 !important 覆写，壁纸层才会透出。结构性选择器，不依赖哈希类名。
    function applyFrameTransparency(on) {
      if (typeof document === 'undefined') return false;
      var frame = document.querySelector('#root [data-slot="root"] > div');
      if (frame) {
        if (on) frame.style.setProperty('background-color', 'transparent', 'important');
        else frame.style.removeProperty('background-color');
      }
      return frame !== null;
    }

    // 主内容区可能还有 CSS-in-JS 硬编码的不透明根容器（如 wSkVaW_root 纯白）盖住壁纸。
    // 类名是哈希（随 DSH 版本变），不能硬编码：扫描主列内覆盖 ≥30% 视口的不透明层，
    // 置为透明并用 dataset 标记（气泡/卡片远小于阈值，不受影响）。
    // 每层只清一次（下次轮询不再清更多的层）。
    function clearMainOpaqueLayers(on) {
      if (typeof document === 'undefined') return false;
      var frame = document.querySelector('#root [data-slot="root"] > div');
      if (!frame) return false;
      var main = frame.children[1] || frame.children[0];
      if (!main) return false;
      var viewportArea = (window.innerWidth || 1400) * (window.innerHeight || 900);
      var cleared = false;
      var walk = function (el) {
        for (var i = 0; i < el.children.length; i++) {
          var c = el.children[i];
          var cs = window.getComputedStyle(c);
          var bg = cs.backgroundColor;
          if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') {
            var r = c.getBoundingClientRect();
            if (r.width * r.height > viewportArea * 0.3) {
              if (on) {
                if (c.dataset.dswWallpaperCleared !== '1') {
                  c.dataset.dswWallpaperCleared = '1';
                  c.style.setProperty('background-color', 'transparent', 'important');
                  cleared = true;
                }
              } else {
                c.style.removeProperty('background-color');
                delete c.dataset.dswWallpaperCleared;
              }
            }
          }
          walk(c);
        }
      };
      walk(main);
      return cleared || true;
    }

    function applyWallpaper(state) {
      if (typeof document === 'undefined') return;
      var docEl = document.documentElement;
      var enabled = state.enabled && state.url !== '';
      // 对话区主背景透明：让壁纸从内容区透出。
      // 与 dsh-skin 同写这个令牌时，后加载的插件覆盖先加载的（本插件 insert 在 skin 之后）。
      if (enabled) {
        // 变量定义/消费都在 body 上（body{--dsw-alias-bg-base:...;background:var(...)}），
        // 必须直接写在 body 才有效（body 自己的声明优先于从 html 继承的值）
        docEl.style.setProperty('--dsw-alias-bg-base', 'transparent', 'important');
        if (document.body) document.body.style.setProperty('--dsw-alias-bg-base', 'transparent', 'important');
      } else {
        docEl.style.removeProperty('--dsw-alias-bg-base');
        if (document.body) document.body.style.removeProperty('--dsw-alias-bg-base');
      }
      var el = ensureWallpaperEl();
      if (enabled) {
        docEl.classList.add('dsw-wallpaper-on');
        el.style.display = 'block';
        // url 必须加引号：未加引号的 data: URL 会被 CSSOM 校验拒绝（background-image 静默失效）
        el.style.backgroundImage = 'url("' + state.url + '")';
        el.style.opacity = String(state.opacity);
        el.style.filter = state.blur > 0 ? 'blur(' + state.blur + 'px)' : 'none';
        applyFrameTransparency(true);
        clearMainOpaqueLayers(true);
      } else {
        docEl.classList.remove('dsw-wallpaper-on');
        el.style.display = 'none';
        applyFrameTransparency(false);
        clearMainOpaqueLayers(false);
      }
    }
    function clearAll() {
      if (typeof document === 'undefined') return;
      var docEl = document.documentElement;
      docEl.classList.remove('dsw-wallpaper-on');
      docEl.style.removeProperty('--dsw-alias-bg-base');
      if (document.body) document.body.style.removeProperty('--dsw-alias-bg-base');
      applyFrameTransparency(false);
      clearMainOpaqueLayers(false);
      var el = getWallpaperEl();
      if (el !== null) el.remove();
    }

    // 本地图片 → dataURL（降采样防超 localStorage 配额）
    function fileToDataUrl(file, cb) {
      var reader = new FileReader();
      reader.onload = function () {
        var img = new Image();
        img.onload = function () {
          var MAX = 1200; // 限制尺寸：超大 dataURL 可能被 CSSOM/localStorage 拒绝
          var scale = Math.min(1, MAX / Math.max(img.width, img.height));
          var canvas = document.createElement('canvas');
          canvas.width = Math.max(1, Math.round(img.width * scale));
          canvas.height = Math.max(1, Math.round(img.height * scale));
          canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
          cb(canvas.toDataURL('image/jpeg', 0.72));
        };
        img.onerror = function () { cb(null); };
        img.src = reader.result;
      };
      reader.onerror = function () { cb(null); };
      reader.readAsDataURL(file);
    }

    function apply(ctx) {
      var slots = ctx.get('slots');
      var state = loadState();
      if (state === null) state = Object.assign({}, DEFAULTS);

      // 主题变化（含 dsh-skin 换肤/亮暗切换）后重写透明令牌，避免被覆盖
      ctx.effect(function () {
        var off = ctx.on('theme/change', function () {
          applyWallpaper(state);
        });
        return off;
      }, 'dsh-wallpaper: scheme sync');

      ctx.effect(function () {
        return function () {
          clearAll();
        };
      });

      function WallpaperRow() {
        var openState = React.useState(false);
        var open = openState[0];
        var setOpen = openState[1];
        var tick = React.useState({});
        var setTick = tick[1];
        var urlState = React.useState(state.url);
        var urlText = urlState[0];
        var setUrlText = urlState[1];
        var rerender = function () { setTick({}); };

        function set(patch) {
          for (var k in patch) {
            if (Object.prototype.hasOwnProperty.call(patch, k)) state[k] = patch[k];
          }
          saveState(state);
          applyWallpaper(state);
          rerender();
        }
        function commitUrl() {
          var v = urlText.trim();
          if (v !== state.url) set({ url: v });
          else rerender();
        }

        return React.createElement('div', { className: 'dswp-rowwrap' },
          React.createElement('button', {
            className: 'dswp-head',
            onClick: function () { setOpen(!open); }
          },
            React.createElement('span', null, '壁纸背景'),
            React.createElement('span', { className: 'dswp-chevron' + (open ? ' dswp-open' : '') }, '▶')
          ),
          open ? React.createElement('div', { className: 'dswp-body' },
            React.createElement('label', { className: 'dswp-toggle' },
              React.createElement('input', {
                type: 'checkbox',
                checked: state.enabled,
                onChange: function (ev) { set({ enabled: ev.target.checked }); }
              }),
              React.createElement('span', null, '启用壁纸（对话区背景变为半透明）')
            ),
            state.enabled && state.url !== '' ?
              React.createElement('div', { className: 'dswp-preview', style: { backgroundImage: 'url("' + state.url + '")' } }) : null,
            React.createElement('div', { className: 'dswp-title' }, '图片地址（URL 或本地文件）'),
            React.createElement('div', { className: 'dswp-url' },
              React.createElement('input', {
                type: 'text',
                className: 'dswp-input',
                placeholder: 'https://... 或留空后用下方按钮选本地图片',
                value: urlText,
                spellCheck: false,
                onChange: function (ev) { setUrlText(ev.target.value); },
                onBlur: commitUrl,
                onKeyDown: function (ev) { if (ev.key === 'Enter') ev.target.blur(); }
              }),
              React.createElement('input', {
                type: 'file',
                accept: 'image/*',
                style: { display: 'none' },
                id: 'dswp-file',
                onChange: function (ev) {
                  var f = ev.target.files && ev.target.files[0];
                  if (!f) return;
                  fileToDataUrl(f, function (data) {
                    if (data === null) { alert('图片读取失败'); return; }
                    set({ url: data, enabled: true });
                    setUrlText('');
                  });
                  ev.target.value = '';
                }
              }),
              React.createElement('button', {
                className: 'dswp-filebtn',
                onClick: function () { var el = document.getElementById('dswp-file'); if (el) el.click(); }
              }, '选本地图片')
            ),
            React.createElement('div', { className: 'dswp-slider' },
              React.createElement('span', { className: 'dswp-title' }, '透明度'),
              React.createElement('input', {
                type: 'range',
                min: 0.1, max: 1, step: 0.05,
                value: state.opacity,
                onChange: function (ev) { set({ opacity: Number(ev.target.value) }); }
              }),
              React.createElement('span', null, Math.round(state.opacity * 100) + '%')
            ),
            React.createElement('div', { className: 'dswp-slider' },
              React.createElement('span', { className: 'dswp-title' }, '模糊'),
              React.createElement('input', {
                type: 'range',
                min: 0, max: 20, step: 1,
                value: state.blur,
                onChange: function (ev) { set({ blur: Number(ev.target.value) }); }
              }),
              React.createElement('span', null, state.blur + 'px')
            ),
            React.createElement('div', { className: 'dswp-hint' },
              '提示：透明度越低壁纸越明显；模糊可以让文字更易读。壁纸只透出在对话区，卡片/侧栏保持不透明以保证可读性。若先用了 dsh-skin 的非默认皮肤，本插件会在主题变化时自动把对话区背景重新置为透明。'
            ),
            React.createElement('button', {
              className: 'dswp-reset',
              onClick: function () {
                state.enabled = false; state.url = ''; state.opacity = DEFAULTS.opacity; state.blur = DEFAULTS.blur;
                saveState(state);
                applyWallpaper(state);
                setUrlText('');
                rerender();
              }
            }, '恢复默认（清除壁纸）')
          ) : null
        );
      }

      applyWallpaper(state);
      // 框架/内容元素可能在插件 apply 之后才挂载：轮询直到覆写成功（上限 ~15s）
      var retries = 0;
      (function retryApply() {
        if (!state.enabled || state.url === '') return;
        var done = applyFrameTransparency(true);
        clearMainOpaqueLayers(true);
        if (!done && retries++ < 15) setTimeout(retryApply, 1000);
      })();
      slots.inject('settings.general.item', function () {
        return slots.register(
          { name: 'settings.general.item', id: 'dsh-wallpaper', order: 16 },
          function () { return React.createElement(WallpaperRow); }
        );
      });
    }

    exports.apply = apply;
    exports.inject = ['slots'];
    return module.exports;
  }
});
