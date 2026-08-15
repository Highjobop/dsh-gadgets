// dsh-tidy browser bundle. 三个对话整理功能（常开，无设置开关）：
// 1) 消息折叠：全局折叠模式 —— 每个回合只保留最后一条 assistant 回答，
//    中间内容（思考/工具/中间输出）全部隐藏。对话区左上角按钮切换
//    「简洁 / 完整」，选择持久化在 localStorage（默认完整）。
// 2) 导航条：右侧短横杠节点（每 user 消息一个，悬停才读取前几个字作为提示），
//    自动加载全部历史（按钮就绪才点、最多 8 页、无增长即停），可上下滚动。
// 3) 总 Token 徽章：对话区左下角圆角矩形，与折叠按钮左对齐、与底部统计行
//    （"74 轮 · 757 步"）底对齐；只显示总 token，数据读 client 会话投影。
// 安全设计（全部对照官方源码 DOM 契约）：
// - 绝不向 React 管理的 [data-chat-flow] 子树插入任何节点：只改既有元素的
//   style.display；按钮/导航条/徽章挂在 document.body 浮动层。
// - observer 收窄：body 只观察 childList，flow 容器才观察子树；回调 rAF 节流，
//   watchdog 每秒一次完整调度；折叠扫描 ≥150ms 节流；历史加载轻量化（不重叠、
//   不暂停导航重建），避免刷新后页面卡顿。
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
      '.dshtidy-fbtn{position:fixed;z-index:900;left:0;top:0;display:inline-flex;flex-direction:row;align-items:baseline;gap:16px;margin:2px 4px;padding:8px 18px;border:1px solid var(--dsw-alias-border-l2);border-radius:22px;background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-secondary);font:inherit;cursor:pointer;box-shadow:var(--dsw-shadow-lv1);transition:border-color .15s,box-shadow .15s,transform .1s}',
      '.dshtidy-fbtn:hover{border-color:var(--dsw-alias-brand-primary);box-shadow:var(--dsw-shadow-lv2);transform:translateY(-1px)}',
      '.dshtidy-fbtn:active{transform:translateY(0)}',
      '.dshtidy-fbtn-main{font-size:13px;font-weight:500;line-height:18px;color:var(--dsw-alias-label-primary)}',
      '.dshtidy-fbtn-sub{font-size:11px;line-height:16px;color:var(--dsw-alias-label-secondary);opacity:.75}',
      // ── 导航条：全部短横杠（悬停 title 显示前几个字），激活浅色高亮；可上下滚动 ──
      '.dshtidy-nav{position:fixed;right:10px;top:50%;transform:translateY(-50%);display:flex;flex-direction:column;align-items:center;gap:5px;max-height:calc(100vh - 40px);overflow-y:auto;padding:8px 6px;border:1px solid var(--dsw-alias-border-l1);border-radius:12px;background:var(--dsw-alias-bg-overlay);box-shadow:var(--dsw-shadow-lv2);z-index:1000}',
      '.dshtidy-navdot{display:block;flex:none;width:16px;height:4px;border-radius:2px;border:none;background:var(--dsw-alias-border-l2);cursor:pointer;padding:0;transition:width .15s,background .15s,transform .15s}',
      '.dshtidy-navdot:hover{transform:scaleX(1.3);background:color-mix(in srgb, var(--dsw-specific-bubble-highlight, var(--dsw-alias-brand-primary)) 45%, transparent)}',
      '.dshtidy-navdot.dshtidy-active{width:24px;background:color-mix(in srgb, var(--dsw-specific-bubble-highlight, var(--dsw-alias-brand-primary)) 45%, transparent)}',
      // ── 总 Token 徽章（对话区左下角，圆角矩形，半透明自适应背景 + 细描边，
      //    文字用主题色：浅色背景下浅、深色背景下深，不抢眼。
      //    不用 backdrop-filter——它与半透明背景+描边组合会产生双层边伪影）──
      '.dshtidy-tok{position:fixed;z-index:900;left:0;bottom:0;display:inline-flex;align-items:center;gap:6px;padding:5px 12px;border-radius:16px;background:color-mix(in srgb, var(--dsw-alias-bg-layer-1) 88%, transparent);border:1px solid var(--dsw-alias-border-l2);color:var(--dsw-alias-label-primary);font:inherit;font-size:12px;line-height:16px;pointer-events:none;white-space:nowrap}'
    ].join('\n');
    if (typeof document !== 'undefined' && document.querySelector('style[data-plugin-css="dsh-tidy/ui"]') === null) {
      var uiTag = document.createElement('style');
      uiTag.dataset.plugin = 'dsh-tidy';
      uiTag.dataset.pluginCss = 'dsh-tidy/ui';
      uiTag.textContent = UI_CSS;
      document.head.appendChild(uiTag);
    }

    // ── 消息收纳控制器：全局折叠模式 ──
    function createArchiveController(getFolded, setFolded, getLoadingHistory) {
      var bodyObserver = null;
      var flowObserver = null;
      var raf = null;
      var scanTimer = null;
      var lastScan = 0;
      var watchdog = null;
      var observedFlows = [];

      // 隐藏一个 flowItem 内部的 think/工具行（保留正文），子调用不隐藏
      function hideRowsIn(item) {
        var matches = item.querySelectorAll('[data-chat-call-id], [data-variant="think"]');
        for (var k = 0; k < matches.length; k++) {
          if (matches[k].closest('[data-subcalls]') === null) matches[k].style.display = 'none';
        }
      }
      // 判断 flowItem 是否为 user 消息：kind 为 user，或内部含 user 行锚点（任意深度，
      // 某些 user 消息的锚点有嵌套包裹）。turn-tail 行也带锚点，但它走显式边界分支，无影响。
      function isUserItem(item) {
        return item.getAttribute('data-chat-flow-kind') === 'user' ||
          item.querySelector('[data-time-hover-root]') !== null;
      }
      // 明确的"中间内容"类型（折叠时可隐藏/参与折叠）
      var MIDDLE_KINDS = ['assistant-step', 'tool-call', 'context', 'compaction', 'manual-compaction', 'model-retry', 'unknown'];
      function applyMode() {
        if (!getFolded()) return; // 未折叠时无需扫描（展开状态由切换路径维护）
        var flows = document.querySelectorAll('[data-chat-flow]');
        for (var i = 0; i < flows.length; i++) {
          var flow = flows[i];
          // 折叠：按回合（边界消息之间）分组
          var turns = [];
          var turn = null;
          for (var c2 = 0; c2 < flow.children.length; c2++) {
            var item = flow.children[c2];
            if (!item.hasAttribute('data-chat-anchor-key')) continue;
            var kind = item.getAttribute('data-chat-flow-kind');
            // 边界（自身保留、结束回合）：user / steering / command / command-input /
            // turn-tail / 带 user 锚点的行 / 未知名类型 —— 只折叠明确是中间内容的消息，
            // 其余一律保守保留（防止 goal/command 等特殊会话的提问被误隐藏）
            var isMiddle = kind !== null && MIDDLE_KINDS.indexOf(kind) !== -1;
            if (!isMiddle || isUserItem(item)) {
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
        if (getLoadingHistory()) return; // 自动加载历史期间跳过扫描，避免卡顿
        if (raf !== null) return;
        raf = requestAnimationFrame(function () {
          raf = null;
          // 节流：流式输出时每帧都触发，扫描全 flow 太重；两次扫描至少间隔 150ms
          var wait = 150 - (Date.now() - lastScan);
          if (wait > 0) {
            scanTimer = setTimeout(function () {
              scanTimer = null;
              lastScan = Date.now();
              try {
                attachFlows();
                applyMode();
              } catch (e) { /* DOM 竞态忽略 */ }
            }, wait);
            return;
          }
          lastScan = Date.now();
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
        if (scanTimer !== null) { clearTimeout(scanTimer); scanTimer = null; }
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
        btn.children[0].textContent = folded ? '简洁模式' : '完整模式';
        btn.children[1].textContent = folded ? '点击切换为完整模式' : '点击切换为简洁模式';
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
    function createNavbarController(getLoadingHistory, setLoadingHistory) {
      var bar = null;
      var bodyObserver = null;
      var flowObserver = null;
      var raf = null;
      var watchdog = null;
      var nodes = [];
      var observedFlows = [];
      var MAX_NODES = 100;
      var loadTimer = null;

      // 导航节点：按 flowItem 类型识别。
      // user / steering / command-input（/goal 命令气泡）是"你的话"，算节点；
      // command（命令结果行，如 goal 状态卡片"Goal created Status: active…"）不算！
      // 只统计【可见】的对话流——会话切换后旧的隐藏 flow 可能残留，混入会
      // 导致节点错乱（必须刷新才恢复）。
      function userAnchors() {
        var out = [];
        var flows = document.querySelectorAll('[data-chat-flow]');
        for (var i = 0; i < flows.length; i++) {
          var flow = flows[i];
          var r0 = flow.getBoundingClientRect();
          if (flow.offsetParent === null && r0.width === 0 && r0.height === 0) continue; // 跳过隐藏 flow
          for (var c = 0; c < flow.children.length; c++) {
            var item = flow.children[c];
            if (!item.hasAttribute('data-chat-anchor-key')) continue;
            var kind = item.getAttribute('data-chat-flow-kind');
            if (kind === 'user' || kind === 'steering' || kind === 'command-input') {
              out.push(item);
              continue;
            }
            // 兼容：kind 缺失但含 user 行锚点
            if (kind === null && item.querySelector('[data-time-hover-root]') !== null) out.push(item);
          }
        }
        return out;
      }
      function previewText(anchor) {
        var bubble = anchor.querySelector('[class*="bubble"]');
        var text = ((bubble !== null ? bubble : anchor).textContent || '').replace(/\s+/g, ' ').trim();
        if (text.length === 0) return '（空消息）';
        return text.length > 12 ? text.slice(0, 12) + '…' : text;
      }
      // 自动加载全部历史：轻量策略 —— 按钮就绪（非禁用）才点、最多 8 页、
      // 内容不增长即停、12s 硬上限；加载期间折叠扫描暂停（loadingHistory 由
      // apply 层共享），导航重建不暂停（已轻量化），横杠随加载实时增长。
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
        var count = 0;          // 实际点击成功次数
        var lastAnchors = -1;   // 上一次看到的内容量
        var noGrowth = 0;       // 按钮空闲但内容不再增长的连续 tick 数
        var started = Date.now();
        setLoadingHistory(true);
        loadTimer = setInterval(function () {
          try {
            // 任何异常（如切换会话时 DOM 重建）都要结束加载，否则 loadingHistory
            // 卡死会让折叠永久停摆
            var btn = findOlderButton();
            var anchors = userAnchors().length;
            // 硬停止：按钮没了 / 已加载足够 / 点击次数到顶 / 总时长超限（防挂起）
            if (btn === null || count >= 8 || anchors >= MAX_NODES || Date.now() - started > 12000) {
              clearInterval(loadTimer);
              loadTimer = null;
              setLoadingHistory(false);
              schedule(); // 加载完成：一次渲染完整节点
              // 内容未就绪就退出的场景：新会话 flow 刚挂载时「加载更早」按钮
              // 可能还没渲染出来，此时停止会导致该会话再也不自动加载（必须刷新）。
              // 延迟重试几次兜底（retryFor 绑定当前可见 flow，换会话后重新计数）。
              if (btn === null && count === 0 && retryAttempts < 3) {
                retryAttempts++;
                if (retryTimer === null) {
                  retryTimer = setTimeout(function () {
                    retryTimer = null;
                    startLoadAll();
                  }, 1500);
                }
              }
              return;
            }
            // 上一页还在加载中（按钮禁用）→ 跳过本次 tick，避免无效点击与加载重叠
            if (btn.disabled) return;
            // 按钮空闲但内容不再增长 → 已经到头，停止
            if (anchors === lastAnchors) {
              noGrowth++;
              if (noGrowth >= 2) {
                clearInterval(loadTimer);
                loadTimer = null;
                setLoadingHistory(false);
                schedule();
                return;
              }
            } else {
              noGrowth = 0;
            }
            lastAnchors = anchors;
            btn.click();
            count++;
          } catch (e) {
            clearInterval(loadTimer);
            loadTimer = null;
            setLoadingHistory(false);
            schedule();
          }
        }, 700);
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
        // 无变化跳过：可见 flow 过滤已解决旧根因（隐藏 flow 混入），
        // 跳过可避免流式输出时每帧重建导致的抖动；watchdog 兜底会话切换。
        var same = nodes.length === anchors.length;
        if (same) {
          for (var a = 0; a < anchors.length; a++) {
            if (nodes[a].anchor !== anchors[a]) { same = false; break; }
          }
        }
        if (same) {
          bar.style.display = nodes.length >= 1 ? '' : 'none';
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
            // 提示文字（气泡前几个字）延迟到悬停/聚焦时才读取——重建时读全部
            // 气泡文本是刷新后卡顿的主因；悬停时才读，成本趋近于零
            var title = null;
            var applyTitle = function () {
              if (title === null) title = '跳转到消息 ' + (idx + 1) + '：' + previewText(anchor);
              dot.title = title;
            };
            dot.addEventListener('mouseenter', applyTitle);
            dot.addEventListener('focus', applyTitle);
            dot.addEventListener('click', function () {
              // 点击时按索引重新定位锚点（避免 React 重建后旧引用失效导致跳转无效）
              var current = userAnchors()[idx];
              if (current !== undefined) current.scrollIntoView({ behavior: 'smooth', block: 'start' });
            });
            bar.appendChild(dot);
            nodes.push({ anchor: anchor, dot: dot });
          })(limited[i], i);
        }
        bar.style.display = nodes.length >= 1 ? '' : 'none';
        updateActive();
      }
      function onScroll() {
        if (raf !== null) return;
        raf = requestAnimationFrame(function () {
          raf = null;
          updateActive();
        });
      }
      // 检测可见 flow 集合变化 → 重新触发历史加载（startLoadAll 防重入）。
      // 用「可见 flow 集合的签名」而不是单个 lastFlow：切换会话时新旧 flow
      // 的挂载/隐藏顺序不定，只比较第一个可见 flow 会在"内容尚未就绪"时
      // 错过触发，导致横杠不自动加载（必须刷新才恢复）。
      var lastFlowSig = '';
      var retryTimer = null;
      var retryAttempts = 0;
      function ensureHistoryLoad() {
        var flows = document.querySelectorAll('[data-chat-flow]');
        var sig = [];
        for (var i = 0; i < flows.length; i++) {
          var r0 = flows[i].getBoundingClientRect();
          if (flows[i].offsetParent !== null || r0.width > 0) {
            sig.push(flows[i].getAttribute('data-chat-flow-key') || flows[i].getAttribute('data-chat-anchor-key') || ('flow-' + i));
          }
        }
        var next = sig.join(',');
        if (next !== lastFlowSig) {
          lastFlowSig = next;
          retryAttempts = 0; // 换了可见会话，重试计数重置
          startLoadAll();
        }
      }
      function schedule() {
        // 加载历史期间不暂停重建：重建已轻量化（懒读标题），横杠随加载实时增长，
        // 避免刷新后导航条长时间"卡住不动"的观感
        if (raf !== null) return;
        raf = requestAnimationFrame(function () {
          raf = null;
          try {
            attachFlows();
            ensureHistoryLoad();
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
        // flowObserver 直接触发 schedule（rAF 节流到每帧一次）；
        // 防抖由 rebuild 的"无变化跳过"负责：流式输出时节点未变 → 跳过（不重建、不抖），
        // 新消息挂载 → 节点变化 → 重建（正常更新）。
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
        // watchdog 每 500ms：会话切换后任何竞态 ≤0.5s 恢复正确
        watchdog = setInterval(schedule, 500);
        attachFlows();
        rebuild();
        // 自动加载全部历史（轻量：就绪才点、最多 8 页；切换会话由 ensureHistoryLoad 再次触发）
        startLoadAll();
      }
      function stop() {
        if (watchdog !== null) { clearInterval(watchdog); watchdog = null; }
        if (loadTimer !== null) { clearInterval(loadTimer); loadTimer = null; }
        if (retryTimer !== null) { clearTimeout(retryTimer); retryTimer = null; }
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

    // ── 总 Token 徽章：对话区左下角圆角矩形，与折叠按钮左对齐、
    //    与底部统计行（"74 轮 · 757 步"）底对齐；token 数据直接读 client 端
    //    会话投影（sessions.history 的 projections，无需自定义 host API）──
    function createTokenBadgeController(ctx) {
      var badge = null;
      var raf = null;
      var timer = null;
      var lastValue = null;
      var wasHidden = true; // 徽章刚挂载时未定位到对话流，避免重复触发取数
      var sessionSub = null; // sessions.list 订阅（切换会话立即取数）

      function formatTokens(n) {
        if (n === null || n === undefined) return '--';
        if (n >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
        if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
        return String(n);
      }
      // 统计行在 composer 区（输入框下方 dock）内渲染，不在 [data-chat-flow] 里；
      // 只在该区域内找文本，避免误匹配用户消息里引用的"74 轮 · 757 步"。
      function findStatsLine(root) {
        if (!root || typeof document === 'undefined' || !document.createTreeWalker) return null;
        var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
        var node;
        while ((node = walker.nextNode()) !== null) {
          var t = node.data || '';
          if ((t.indexOf('轮') !== -1 && t.indexOf('步') !== -1) || (t.indexOf('rounds') !== -1 && t.indexOf('steps') !== -1)) {
            var p = node.parentElement;
            while (p !== null && p !== root && p.childElementCount === 1) p = p.parentElement;
            return p;
          }
        }
        return null;
      }
      // 第一个可见对话流的滚动容器（与折叠按钮同一锚点）
      function visibleFlowAndAnchor() {
        var flows = document.querySelectorAll('[data-chat-flow]');
        var flow = null;
        for (var i = 0; i < flows.length; i++) {
          var r0 = flows[i].getBoundingClientRect();
          if (flows[i].offsetParent !== null || r0.width > 0) { flow = flows[i]; break; }
        }
        if (flow === null) return null;
        var anchor = flow.parentElement;
        while (anchor !== null) {
          var s = getComputedStyle(anchor);
          if (s.overflowY === 'auto' || s.overflowY === 'scroll') break;
          anchor = anchor.parentElement;
        }
        if (anchor === null) anchor = flow;
        return anchor;
      }
      function position() {
        if (badge === null) return;
        var anchor = visibleFlowAndAnchor();
        if (anchor === null) { badge.style.display = 'none'; wasHidden = true; return; }
        // 左对齐折叠按钮：直接取按钮的可见左缘（含其 margin），滚动/缩放时两者始终一致
        var fbtn = document.querySelector('.dshtidy-fbtn');
        var left;
        if (fbtn !== null && fbtn.getBoundingClientRect().width > 0) {
          left = fbtn.getBoundingClientRect().left;
        } else {
          var rect = anchor.getBoundingClientRect();
          if (rect.width === 0 || rect.height === 0) { badge.style.display = 'none'; return; }
          left = Math.max(8, rect.left + 8); // 与按钮 style.left + margin-left 对齐
        }
        badge.style.left = Math.max(8, left) + 'px';
        // 底对齐统计行；统计行在会话运行中不渲染 → 退回对齐对话列底边
        var bottomY = null;
        var seat = document.querySelector('[data-composer-seat]');
        var statsLine = findStatsLine(seat !== null ? seat : document);
        if (statsLine !== null) {
          var sr = statsLine.getBoundingClientRect();
          if (sr.height > 0) bottomY = sr.bottom;
        }
        if (bottomY === null) {
          var sb = document.querySelector('[data-conversation-scroll]');
          if (sb !== null) {
            var sbr = sb.getBoundingClientRect();
            if (sbr.height > 0) bottomY = sbr.bottom;
          }
        }
        if (bottomY === null) {
          var rect2 = anchor.getBoundingClientRect();
          if (rect2.width === 0 || rect2.height === 0) { badge.style.display = 'none'; return; }
          bottomY = rect2.bottom;
        }
        badge.style.bottom = Math.max(4, window.innerHeight - bottomY) + 'px';
        badge.style.display = '';
        // 对话流刚挂载（徽章由隐藏变可见）时立即取数，不等下一个轮询周期
        if (wasHidden) {
          wasHidden = false;
          fetchTotal();
        }
      }
      // 从会话投影块取总 token（输入 + 输出；口径对齐官方 StatsLine：
      // billedInput = uncachedInputTokens + cacheReadTokens + cacheWriteTokens）
      function applyUsage(values) {
        if (values === null || values === undefined) return;
        var usage = values.tokenUsage;
        var stats = values.sessionStats;
        var input = null;
        var output = null;
        if (usage && typeof usage === 'object') {
          // 官方口径：billedInput = uncachedInputTokens + cacheReadTokens + cacheWriteTokens
          if (typeof usage.uncachedInputTokens === 'number' && typeof usage.cacheReadTokens === 'number' && typeof usage.cacheWriteTokens === 'number') {
            input = usage.uncachedInputTokens + usage.cacheReadTokens + usage.cacheWriteTokens;
          }
          if (typeof usage.outputTokens === 'number') output = usage.outputTokens;
        }
        if (output === null && stats && typeof stats.decodeTokens === 'number') output = stats.decodeTokens;
        if (input === null && output === null) return;
        var total = (input || 0) + (output || 0);
        if (total !== lastValue) {
          lastValue = total;
          if (badge !== null) badge.textContent = '总 Token：' + formatTokens(total);
        }
      }
      function fetchFor(sessionId) {
        var connection = ctx.get('connection');
        if (connection === undefined || connection.api === undefined || connection.api.sessions === undefined || connection.api.sessions.history === undefined) return;
        connection.api.sessions.history({ sessionId: sessionId }).then(function (res) {
          // 官方返回 { rpcId, result: { ok, value } }，不是 { ok, value }
          if (res === null || res === undefined || !res.result || res.result.ok !== true || !res.result.value) return;
          if (res.result.value.projections && res.result.value.projections.values) applyUsage(res.result.value.projections.values);
        }).catch(function () { /* 忽略 */ });
      }
      // 当前打开的会话 id：client sessions 服务的选中项
      function currentSessionId() {
        try {
          var sessions = ctx.get('sessions');
          if (sessions !== undefined && sessions.list && typeof sessions.list.getSnapshot === 'function') {
            var snap = sessions.list.getSnapshot();
            if (snap !== null && typeof snap.current === 'string' && snap.current.length > 0) return snap.current;
          }
        } catch (e) { /* 忽略 */ }
        return null;
      }
      // 会话切换即取数：id 变化时立即拉一次；同一会话由低频定时器轮询
      var lastSessionId = null;
      function fetchTotal() {
        var id = currentSessionId();
        var changed = id !== null && id !== lastSessionId;
        if (changed) {
          lastSessionId = id;
          lastValue = null; // 换会话后旧值作废，等新值回来再显示
        }
        if (id !== null) {
          if (changed) fetchFor(id);
          return;
        }
        // 兜底：取最近更新的会话
        try {
          var connection = ctx.get('connection');
          if (connection === undefined || connection.api === undefined || connection.api.sessions === undefined || connection.api.sessions.list === undefined) return;
          connection.api.sessions.list({}).then(function (res) {
            if (res && res.result && res.result.ok === true && res.result.value && res.result.value.items && res.result.value.items.length > 0) {
              fetchFor(res.result.value.items[0].sessionId);
            }
          }).catch(function () { /* 忽略 */ });
        } catch (e) { /* 忽略 */ }
      }
      function onScroll() {
        if (raf !== null) return;
        raf = requestAnimationFrame(function () {
          raf = null;
          position();
        });
      }
      function start() {
        if (badge !== null) return;
        badge = document.createElement('div');
        badge.className = 'dshtidy-tok';
        badge.textContent = '总 Token：--';
        document.body.appendChild(badge);
        window.addEventListener('scroll', onScroll, true);
        window.addEventListener('resize', onScroll);
        // 低频轮询（10s）：同一会话的 token 增长不必频繁刷新；
        // 切换会话由 sessions.list 订阅立即取数（不依赖轮询周期）。
        // 页面隐藏（切后台标签）时暂停取数，回来立即补一次。
        var onVisibility = function () {
          if (document.visibilityState === 'visible') {
            position();
            fetchTotal();
          }
        };
        document.addEventListener('visibilitychange', onVisibility);
        try {
          var sessions = ctx.get('sessions');
          if (sessions !== undefined && sessions.list && typeof sessions.list.subscribe === 'function') {
            sessionSub = sessions.list.subscribe(function () {
              // 会话切换（current 变化）：立即取数 + 重新定位
              position();
              fetchTotal();
            });
          }
        } catch (e) { /* 忽略 */ }
        timer = setInterval(function () {
          position();
          if (document.visibilityState !== 'hidden') fetchTotal();
        }, 10000);
        position();
        fetchTotal();
      }
      function stop() {
        if (timer !== null) { clearInterval(timer); timer = null; }
        if (sessionSub !== null) { try { sessionSub(); } catch (e) { /* 忽略 */ } sessionSub = null; }
        if (raf !== null) { cancelAnimationFrame(raf); raf = null; }
        window.removeEventListener('scroll', onScroll, true);
        window.removeEventListener('resize', onScroll);
        document.removeEventListener('visibilitychange', onVisibility);
        if (badge !== null) { badge.remove(); badge = null; }
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
      var tokenBadgeCtrl = null;
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

      // 自动加载历史的节流标志：折叠扫描在加载期间暂停（导航重建不受影响）
      var loadingHistory = false;
      function getLoadingHistory() { return loadingHistory; }
      function setLoadingHistory(v) { loadingHistory = v; }

      function startAll() {
        if (archiveCtrl === null) {
          archiveCtrl = createArchiveController(getFolded, setFolded, getLoadingHistory);
          modeBtnCtrl = createModeButtonController(getFolded, setFolded);
          archiveCtrl.start();
          modeBtnCtrl.start();
        }
        if (navCtrl === null) { navCtrl = createNavbarController(getLoadingHistory, setLoadingHistory); navCtrl.start(); }
        if (tokenBadgeCtrl === null) { tokenBadgeCtrl = createTokenBadgeController(ctx); tokenBadgeCtrl.start(); }
      }
      startAll();
      ctx.effect(function () {
        return function () {
          if (archiveCtrl !== null) archiveCtrl.stop();
          if (modeBtnCtrl !== null) modeBtnCtrl.stop();
          if (navCtrl !== null) navCtrl.stop();
          if (tokenBadgeCtrl !== null) tokenBadgeCtrl.stop();
        };
      }, 'dsh-tidy: controllers cleanup');
    }

    exports.apply = apply;
    return module.exports;
  }
});
