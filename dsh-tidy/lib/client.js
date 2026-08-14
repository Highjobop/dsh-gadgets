// dsh-tidy browser bundle. 两个对话整理功能（常开，无设置开关）：
// 1) 消息折叠：全局折叠模式 —— 每个回合只保留最后一条 assistant 回答，
//    中间内容（思考/工具/中间输出）全部隐藏。对话区左上角按钮切换
//    「已折叠 / 全放开」，选择持久化在 localStorage（默认全放开）。
// 2) 导航条：右侧短横杠节点（每 user 消息一个，悬停显示前几个字），
//    自动加载全部历史（点「加载更早」最多 20 次），可上下滚动。
// 安全设计（全部对照官方源码 DOM 契约）：
// - 绝不向 React 管理的 [data-chat-flow] 子树插入任何节点：只改既有元素的
//   style.display；按钮/导航条挂在 document.body 浮动层。
// - observer 收窄：body 只观察 childList，flow 容器才观察子树；回调 rAF 节流，
//   watchdog 每秒一次完整调度，历史自动加载期间暂停导航重建避免卡顿。
// - 匹配真实结构：flowItem 内递归找 [data-chat-call-id] / [data-variant="think"]，
//   排除 [data-subcalls] 内子调用；user/turn-tail 是回合边界（保持可见）。
window.__ModuleLoader__.load({
  id: 'dsh-tidy',
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;
    Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });

    var UI_CSS = [
      // ── 折叠模式按钮（body 浮动层，对话区左上角，单行）──
      '.dshtidy-fbtn{position:fixed;z-index:900;left:0;top:0;display:inline-flex;flex-direction:row;align-items:baseline;gap:16px;margin:2px 4px;padding:8px 18px;border:1px solid var(--dsw-alias-border-l2);border-radius:22px;background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-secondary);font:inherit;cursor:pointer;box-shadow:var(--dsw-shadow-lv2);transition:border-color .15s,box-shadow .15s,transform .1s}',
      '.dshtidy-fbtn:hover{border-color:var(--dsw-alias-brand-primary);box-shadow:var(--dsw-shadow-lv3);transform:translateY(-1px)}',
      '.dshtidy-fbtn:active{transform:translateY(0)}',
      '.dshtidy-fbtn-main{font-size:13px;font-weight:500;line-height:18px;color:var(--dsw-alias-label-primary)}',
      '.dshtidy-fbtn-sub{font-size:11px;line-height:16px;color:var(--dsw-alias-label-secondary);opacity:.75}',
      // ── 导航条：全部短横杠（悬停 title 显示前几个字），激活浅色高亮；可上下滚动 ──
      '.dshtidy-nav{position:fixed;right:10px;top:50%;transform:translateY(-50%);display:flex;flex-direction:column;align-items:center;gap:5px;max-height:calc(100vh - 40px);overflow-y:auto;padding:8px 6px;border:1px solid var(--dsw-alias-border-l1);border-radius:12px;background:var(--dsw-alias-bg-overlay);box-shadow:var(--dsw-shadow-lv2);z-index:1000}',
      '.dshtidy-navdot{display:block;flex:none;width:16px;height:4px;border-radius:2px;border:none;background:var(--dsw-alias-border-l2);cursor:pointer;padding:0;transition:width .15s,background .15s,transform .15s}',
      '.dshtidy-navdot:hover{transform:scaleX(1.3);background:color-mix(in srgb, var(--dsw-specific-bubble-highlight, var(--dsw-alias-brand-primary)) 45%, transparent)}',
      '.dshtidy-navdot.dshtidy-active{width:24px;background:color-mix(in srgb, var(--dsw-specific-bubble-highlight, var(--dsw-alias-brand-primary)) 45%, transparent)}'
    ].join('\n');
    if (typeof document !== 'undefined' && document.querySelector('style[data-plugin-css="dsh-tidy/ui"]') === null) {
      var uiTag = document.createElement('style');
      uiTag.dataset.plugin = 'dsh-tidy';
      uiTag.dataset.pluginCss = 'dsh-tidy/ui';
      uiTag.textContent = UI_CSS;
      document.head.appendChild(uiTag);
    }

    // ── 消息收纳控制器：全局折叠模式 ──
    function createArchiveController(getFolded, setFolded) {
      var bodyObserver = null;
      var flowObserver = null;
      var raf = null;
      var watchdog = null;
      var observedFlows = [];

      // 隐藏一个 flowItem 内部的 think/工具行（保留正文），子调用不隐藏
      function hideRowsIn(item) {
        var matches = item.querySelectorAll('[data-chat-call-id], [data-variant="think"]');
        for (var k = 0; k < matches.length; k++) {
          if (matches[k].closest('[data-subcalls]') === null) matches[k].style.display = 'none';
        }
      }
      // 判断 flowItem 是否为 user 消息：kind 优先，退回行内锚点（仅直接子级，
      // 避免误匹配 turn-tail 等内部也带 data-time-hover-root 的节点）
      function isUserItem(item) {
        return item.getAttribute('data-chat-flow-kind') === 'user' ||
          (item.getAttribute('data-chat-flow-kind') === null && item.querySelector(':scope > [data-time-hover-root]') !== null);
      }
      function applyMode() {
        if (!getFolded()) return; // 未折叠时无需扫描（展开状态由切换路径维护）
        var flows = document.querySelectorAll('[data-chat-flow]');
        for (var i = 0; i < flows.length; i++) {
          var flow = flows[i];
          // 折叠：按回合（user/turn-tail 消息之间）分组
          var turns = [];
          var turn = null;
          for (var c2 = 0; c2 < flow.children.length; c2++) {
            var item = flow.children[c2];
            if (!item.hasAttribute('data-chat-anchor-key')) continue;
            var kind = item.getAttribute('data-chat-flow-kind');
            // user / steering（中途改需求的你的话）/ turn-tail 都是回合边界（自身保持可见）
            if (isUserItem(item) || kind === 'steering' || kind === 'turn-tail') {
              if (turn !== null) turns.push(turn);
              turn = null;
              continue;
            }
            if (turn === null) turn = { items: [], lastAssistant: null };
            turn.items.push(item);
            if (kind === 'assistant-step') turn.lastAssistant = item;
          }
          if (turn !== null) turns.push(turn);
          for (var t = 0; t < turns.length; t++) {
            var tr = turns[t];
            var keep = tr.lastAssistant;
            if (keep === null && tr.items.length > 0) keep = tr.items[tr.items.length - 1]; // 中断回合兜底：保留最后一项
            for (var j = 0; j < tr.items.length; j++) {
              var it = tr.items[j];
              if (it === keep) {
                // 只保留最终结果：隐藏它内部的 think/工具行，正文完整显示
                hideRowsIn(it);
                it.style.display = '';
              } else {
                // 中间的一切（思考、工具、中间的文字输出）全部隐藏
                it.style.display = 'none';
              }
            }
          }
        }
      }
      function schedule() {
        if (raf !== null) return;
        raf = requestAnimationFrame(function () {
          raf = null;
          try {
            attachFlows();
            applyMode();
          } catch (e) { /* DOM 竞态忽略 */ }
        });
      }
      function attachFlows() {
        if (flowObserver === null) return;
        // 清理已卸载的 flow 观察记录
        observedFlows = observedFlows.filter(function (f) { return f.isConnected; });
        var flows = document.querySelectorAll('[data-chat-flow]');
        for (var i = 0; i < flows.length; i++) {
          var f = flows[i];
          if (observedFlows.indexOf(f) === -1) {
            flowObserver.observe(f, { childList: true, subtree: true });
            observedFlows.push(f);
          }
        }
      }
      function start() {
        if (bodyObserver !== null) return;
        flowObserver = new MutationObserver(schedule);
        bodyObserver = new MutationObserver(function () {
          if (raf !== null) return;
          raf = requestAnimationFrame(function () {
            raf = null;
            attachFlows();
            schedule();
          });
        });
        bodyObserver.observe(document.body, { childList: true });
        // watchdog：对话视图可能晚于插件激活挂载，每秒一次完整调度（含首扫）
        watchdog = setInterval(schedule, 1000);
        attachFlows();
        applyMode();
      }
      function restoreAll() {
        var flows = document.querySelectorAll('[data-chat-flow]');
        for (var f = 0; f < flows.length; f++) {
          var rows = flows[f].querySelectorAll('[data-chat-call-id], [data-variant="think"]');
          for (var r = 0; r < rows.length; r++) rows[r].style.display = '';
          for (var c = 0; c < flows[f].children.length; c++) flows[f].children[c].style.display = '';
        }
      }
      function stop() {
        if (watchdog !== null) { clearInterval(watchdog); watchdog = null; }
        if (bodyObserver !== null) { bodyObserver.disconnect(); bodyObserver = null; }
        if (flowObserver !== null) { flowObserver.disconnect(); flowObserver = null; }
        if (raf !== null) { cancelAnimationFrame(raf); raf = null; }
        restoreAll();
        observedFlows = [];
      }
      return { start: start, stop: stop, applyMode: applyMode, restoreAll: restoreAll };
    }

    // ── 折叠模式按钮（对话区左上角）──
    function createModeButtonController(getFolded, setFolded) {
      var btn = null;
      var raf = null;
      var watchdog = null;

      function updateText() {
        if (btn === null) return;
        if (btn.children.length < 2) return;
        var folded = getFolded();
        btn.children[0].textContent = folded ? '已折叠' : '全放开';
        btn.children[1].textContent = folded ? '点击展开' : '点击折叠';
      }
      function position() {
        if (btn === null) return;
        // 只定位到可见的对话流（避免选中隐藏/离屏 flow 导致按钮跑到页面左上角）
        var flows = document.querySelectorAll('[data-chat-flow]');
        var flow = null;
        for (var i = 0; i < flows.length; i++) {
          var r0 = flows[i].getBoundingClientRect();
          if (flows[i].offsetParent !== null || r0.width > 0) { flow = flows[i]; break; }
        }
        if (flow === null) { btn.style.display = 'none'; return; }
        // 锚定对话流的滚动容器（对话列可见区域）——flow 本身是滚动内容，
        // 滚动后其 top 会变成负数，直接用它会把按钮钳到页面最上方。
        var anchor = flow.parentElement;
        while (anchor !== null) {
          var s = getComputedStyle(anchor);
          if (s.overflowY === 'auto' || s.overflowY === 'scroll') break;
          anchor = anchor.parentElement;
        }
        if (anchor === null) anchor = flow;
        var rect = anchor.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) { btn.style.display = 'none'; return; }
        btn.style.display = '';
        // 对话窗口（滚动容器）的左上角，「对话/轨迹」tab 栏正下方
        btn.style.left = Math.max(8, rect.left + 4) + 'px';
        btn.style.top = Math.max(8, rect.top + 4) + 'px';
      }
      function onScroll() {
        if (raf !== null) return;
        raf = requestAnimationFrame(function () {
          raf = null;
          position();
        });
      }
      function start() {
        if (btn !== null) return;
        btn = document.createElement('button');
        btn.className = 'dshtidy-fbtn';
        btn.title = '折叠：只显示最终结果，隐藏思考过程与工具调用';
        btn.addEventListener('click', function () {
          setFolded(!getFolded());
          updateText();
        });
        var main = document.createElement('span');
        main.className = 'dshtidy-fbtn-main';
        var sub = document.createElement('span');
        sub.className = 'dshtidy-fbtn-sub';
        btn.appendChild(main);
        btn.appendChild(sub);
        document.body.appendChild(btn);
        window.addEventListener('scroll', onScroll, true);
        window.addEventListener('resize', onScroll);
        watchdog = setInterval(position, 1000);
        updateText();
        position();
      }
      function stop() {
        if (watchdog !== null) { clearInterval(watchdog); watchdog = null; }
        if (raf !== null) { cancelAnimationFrame(raf); raf = null; }
        window.removeEventListener('scroll', onScroll, true);
        window.removeEventListener('resize', onScroll);
        if (btn !== null) { btn.remove(); btn = null; }
      }
      return { start: start, stop: stop };
    }

    // ── 导航条：仅 user 行锚点（气泡结构检测），右侧文字节点显示消息前几个字 ──
    function createNavbarController() {
      var bar = null;
      var bodyObserver = null;
      var flowObserver = null;
      var raf = null;
      var watchdog = null;
      var nodes = [];
      var observedFlows = [];
      var MAX_NODES = 100;
      var loadTimer = null;

      // user 行过滤（参考 dsh-navbar）：data-time-hover-root + 气泡结构；
      // 排除 pending steering 与 assistant/turn-tail 行。
      function userAnchors() {
        var all = document.querySelectorAll('[data-time-hover-root]');
        var out = [];
        for (var i = 0; i < all.length; i++) {
          var row = all[i];
          if (row.hasAttribute('data-pending-steering')) continue;
          if (row.querySelector('[class*="bubble"]') === null) continue;
          out.push(row);
        }
        return out;
      }
      function previewText(anchor) {
        var bubble = anchor.querySelector('[class*="bubble"]');
        var text = ((bubble !== null ? bubble : anchor).textContent || '').replace(/\s+/g, ' ').trim();
        if (text.length === 0) return '（空消息）';
        return text.length > 12 ? text.slice(0, 12) + '…' : text;
      }
      // 自动加载全部历史：反复点击「加载更早」直到没有（限次防死循环）；
      // 加载期间暂停导航重建（避免每 350ms 全量重建导致卡顿），完成后一次渲染。
      var loadingHistory = false;
      function findOlderButton() {
        var els = document.querySelectorAll('button');
        for (var i = 0; i < els.length; i++) {
          var b = els[i];
          var t = (b.textContent || '').trim();
          if (t === '加载更早' || t === 'Load earlier') return b;
        }
        var cls = document.querySelector('.Md3f7G_older button');
        if (cls !== null) return cls;
        return null;
      }
      function startLoadAll() {
        if (loadTimer !== null) return;
        var count = 0;
        loadingHistory = true;
        loadTimer = setInterval(function () {
          var btn = findOlderButton();
          // 导航条容量已满（≥100 条提问）即停：继续加载纯属浪费
          if (btn === null || count >= 20 || userAnchors().length >= MAX_NODES) {
            clearInterval(loadTimer);
            loadTimer = null;
            loadingHistory = false;
            schedule(); // 加载完成：一次渲染完整节点
            return;
          }
          btn.click();
          count++;
        }, 400);
      }
      function updateActive() {
        if (nodes.length === 0) return;
        var best = nodes.length - 1;
        var bestTop = Number.POSITIVE_INFINITY;
        for (var i = 0; i < nodes.length; i++) {
          var top = nodes[i].anchor.getBoundingClientRect().top;
          if (top >= 0 && top < bestTop) { bestTop = top; best = i; }
        }
        // 全部短横杠：只切换激活高亮（不改变节点形态）
        for (var j = 0; j < nodes.length; j++) {
          nodes[j].dot.classList.toggle('dshtidy-active', j === best);
        }
      }
      function rebuild() {
        if (bar === null) return;
        var anchors = userAnchors();
        var anchorsSame = nodes.length === anchors.length;
        if (anchorsSame) {
          for (var a = 0; a < anchors.length; a++) {
            if (!anchors[a].isConnected || nodes[a].anchor !== anchors[a]) { anchorsSame = false; break; }
          }
        }
        if (anchorsSame) {
          bar.style.display = nodes.length >= 2 ? '' : 'none';
          updateActive();
          return;
        }
        bar.innerHTML = '';
        nodes = [];
        // 超过上限时保留前 MAX_NODES 个（导航条不消失，而不是全有或全无）
        var limited = anchors.slice(0, MAX_NODES);
        for (var i = 0; i < limited.length; i++) {
          (function (anchor, idx) {
            var dot = document.createElement('button');
            dot.className = 'dshtidy-navdot';
            dot.title = '跳转到消息 ' + (idx + 1) + '：' + previewText(anchor);
            dot.addEventListener('click', function () {
              // 点击时按索引重新定位锚点（避免 React 重建后旧引用失效导致跳转无效）
              var current = userAnchors()[idx];
              if (current !== undefined) current.scrollIntoView({ behavior: 'smooth', block: 'start' });
            });
            bar.appendChild(dot);
            nodes.push({ anchor: anchor, dot: dot });
          })(limited[i], i);
        }
        bar.style.display = nodes.length >= 2 ? '' : 'none';
        updateActive();
      }
      function onScroll() {
        if (raf !== null) return;
        raf = requestAnimationFrame(function () {
          raf = null;
          updateActive();
        });
      }
      function schedule() {
        if (loadingHistory) return; // 加载历史期间跳过重建，避免卡顿
        if (raf !== null) return;
        raf = requestAnimationFrame(function () {
          raf = null;
          try {
            attachFlows();
            rebuild();
          } catch (e) { /* ignore */ }
        });
      }
      function attachFlows() {
        if (flowObserver === null) return;
        // 清理已卸载的 flow 观察记录
        observedFlows = observedFlows.filter(function (f) { return f.isConnected; });
        var flows = document.querySelectorAll('[data-chat-flow]');
        for (var i = 0; i < flows.length; i++) {
          var f = flows[i];
          if (observedFlows.indexOf(f) === -1) {
            flowObserver.observe(f, { childList: true, subtree: true });
            observedFlows.push(f);
          }
        }
      }
      function start() {
        if (bar !== null) return;
        bar = document.createElement('div');
        bar.className = 'dshtidy-nav';
        document.body.appendChild(bar);
        flowObserver = new MutationObserver(schedule);
        bodyObserver = new MutationObserver(function () {
          if (raf !== null) return;
          raf = requestAnimationFrame(function () {
            raf = null;
            attachFlows();
            schedule();
          });
        });
        bodyObserver.observe(document.body, { childList: true });
        window.addEventListener('scroll', onScroll, true);
        watchdog = setInterval(schedule, 1000);
        attachFlows();
        rebuild();
        // 自动加载全部历史（点「加载更早」直到没有）
        startLoadAll();
      }
      function stop() {
        if (watchdog !== null) { clearInterval(watchdog); watchdog = null; }
        if (loadTimer !== null) { clearInterval(loadTimer); loadTimer = null; }
        if (bodyObserver !== null) { bodyObserver.disconnect(); bodyObserver = null; }
        if (flowObserver !== null) { flowObserver.disconnect(); flowObserver = null; }
        if (raf !== null) { cancelAnimationFrame(raf); raf = null; }
        window.removeEventListener('scroll', onScroll, true);
        if (bar !== null) { bar.remove(); bar = null; }
        nodes = [];
        observedFlows = [];
      }
      return { start: start, stop: stop };
    }

    // ── 持久化：localStorage（第三方命名空间无法通过 settings RPC 写入）──
    var STORAGE_KEY = 'dsh-tidy.settings';
    function loadFolded() {
      try {
        var raw = localStorage.getItem(STORAGE_KEY);
        if (raw === null) return false;
        var parsed = JSON.parse(raw);
        return parsed === true;
      } catch (e) {
        return false;
      }
    }
    function saveFolded(value) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
      } catch (e) { /* 存储不可用 */ }
    }

    function apply(ctx) {
      // 消息收纳 + 导航条默认开启，无设置开关
      var archiveCtrl = null;
      var modeBtnCtrl = null;
      var navCtrl = null;
      var folded = loadFolded();

      function getFolded() { return folded; }
      function setFolded(value) {
        folded = value;
        saveFolded(value);
        if (archiveCtrl !== null) {
          if (value) archiveCtrl.applyMode(); // 折叠：应用折叠
          else archiveCtrl.restoreAll();      // 展开：恢复所有行
        }
      }

      function startAll() {
        if (archiveCtrl === null) {
          archiveCtrl = createArchiveController(getFolded, setFolded);
          modeBtnCtrl = createModeButtonController(getFolded, setFolded);
          archiveCtrl.start();
          modeBtnCtrl.start();
        }
        if (navCtrl === null) { navCtrl = createNavbarController(); navCtrl.start(); }
      }
      startAll();
      ctx.effect(function () {
        return function () {
          if (archiveCtrl !== null) archiveCtrl.stop();
          if (modeBtnCtrl !== null) modeBtnCtrl.stop();
          if (navCtrl !== null) navCtrl.stop();
        };
      }, 'dsh-tidy: controllers cleanup');
    }

    exports.apply = apply;
    return module.exports;
  }
});
