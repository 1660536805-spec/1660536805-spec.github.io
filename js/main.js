(function () {
  "use strict";

  /* ============================================================
     1. 移动端导航
     ============================================================ */
  var burger = document.getElementById("navBurger");
  var navLinks = document.getElementById("navLinks");

  if (burger && navLinks) {
    burger.addEventListener("click", function () {
      var open = navLinks.classList.toggle("open");
      burger.classList.toggle("open", open);
      burger.setAttribute("aria-expanded", open ? "true" : "false");
    });
    navLinks.addEventListener("click", function (e) {
      if (e.target.tagName === "A") {
        navLinks.classList.remove("open");
        burger.classList.remove("open");
        burger.setAttribute("aria-expanded", "false");
      }
    });
  }

  /* ============================================================
     2. 技术栈跑马灯：复制一份内容实现无缝循环
     ============================================================ */
  var ticker = document.getElementById("tickerTrack");
  if (ticker) {
    ticker.innerHTML += ticker.innerHTML;
  }

  /* ============================================================
     3. 滚动进入视口时的区块淡入
     ============================================================ */
  document.querySelectorAll(".section").forEach(function (section) {
    var container = section.querySelector(":scope > .container");
    if (container) {
      container.querySelectorAll(":scope > *").forEach(function (child) {
        child.classList.add("section-child");
      });
    }
  });

  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
  document.querySelectorAll(".section").forEach(function (s) {
    io.observe(s);
  });
} else {
  document.querySelectorAll(".section").forEach(function (s) {
    s.classList.add("in");
  });
}

  /* ============================================================
     调试：?demo=report 输出运行环境诊断（排查浏览器兼容问题）
     ============================================================ */
  var reportParam = new URLSearchParams(window.location.search).get("demo");
  if (reportParam === "report") {
    var pre = document.createElement("pre");
    pre.id = "demo-report";
    pre.textContent = JSON.stringify(
      {
        innerWidth: window.innerWidth,
        innerHeight: window.innerHeight,
        dpr: window.devicePixelRatio,
        hover: window.matchMedia("(hover: hover)").matches,
        pointerFine: window.matchMedia("(pointer: fine)").matches,
        pointerCoarse: window.matchMedia("(pointer: coarse)").matches,
        wide768: window.matchMedia("(min-width: 768px)").matches,
        pointerEvent: typeof window.PointerEvent,
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
        overflowX: document.documentElement.scrollWidth > document.documentElement.clientWidth,
        worksCards: Array.prototype.map.call(
          document.querySelectorAll(".work-card"),
          function (c) {
            var r = c.getBoundingClientRect();
            var cover = c.querySelector(".work-cover");
            var shot = c.querySelector(".work-shot, .work-shot-wide");
            var sr = shot ? shot.getBoundingClientRect() : null;
            return {
              x: Math.round(r.x),
              y: Math.round(r.y),
              w: Math.round(r.width),
              h: Math.round(r.height),
              coverH: cover ? Math.round(cover.getBoundingClientRect().height) : 0,
              shotSrc: shot ? shot.getAttribute("src") : null,
              shotLoaded: shot ? shot.complete && shot.naturalWidth > 0 : null,
              shotRect: sr
                ? { x: Math.round(sr.x), y: Math.round(sr.y), w: Math.round(sr.width), h: Math.round(sr.height) }
                : null
            };
          }
        )
      },
      null,
      2
    );
    document.body.appendChild(pre);
  }

  if (reportParam === "works") {
    // 调试：?demo=works 自动滚动到作品区（用于截图验证布局）
    var worksEl = document.getElementById("works");
    if (worksEl) {
      window.scrollTo({ top: worksEl.offsetTop - 60, behavior: "instant" });
    }
  }

  /* ============================================================
     4. Hero 人像：鼠标 spotlight reveal
        - requestAnimationFrame + 指数平滑，位置平滑跟随
        - 径向渐变遮罩的位置/透明度由 CSS 变量驱动
          （mask-image: radial-gradient(circle at var(--spot-x) ...)）
          —— 避免逐帧生成 base64 图片，浏览器里更丝滑
        - 移出区域后遮罩柔和淡出
        - 触屏 / 小屏 / 不支持 mask 时回退为只显示第一张图
     ============================================================ */
  var portrait = document.getElementById("portrait");
  var revealLayer = document.querySelector(".portrait-reveal");
  var hint = document.getElementById("portraitHint");

  if (portrait && revealLayer) {
    // 判断设备是否支持悬停。桌面窗口多窄都保留效果，
    // 避免内嵌浏览器/窄窗口被误判成移动端。
    var hoverSupported = window.matchMedia("(hover: hover)").matches;
    var touchOnly =
      !hoverSupported &&
      (window.matchMedia("(pointer: coarse)").matches || "ontouchstart" in window);
    var canMask =
      "maskImage" in revealLayer.style ||
      "webkitMaskImage" in revealLayer.style;

    if (!canMask) {
      portrait.dataset.reveal = "off";
    } else {
      initReveal(touchOnly);
    }
  }

  function initReveal(touchDevice) {
    var state = {
      targetX: 0,
      targetY: 0,
      x: 0,
      y: 0,
      alpha: 0, // 当前遮罩可见度 0..1
      targetAlpha: 0,
      rectW: 1,
      rectH: 1,
      lastX: -1,
      lastY: -1,
      lastAlpha: -1,
      lastTime: 0,
      rafId: 0
    };

    function sizeWatch() {
      var rect = portrait.getBoundingClientRect();
      state.rectW = Math.max(1, rect.width);
      state.rectH = Math.max(1, rect.height);
      forceRedraw();
    }

    function forceRedraw() {
      state.lastX = -1;
      state.lastY = -1;
      state.lastAlpha = -1;
    }

    function onPointerMove(e) {
      var rect = portrait.getBoundingClientRect();
      state.targetX = e.clientX - rect.left;
      state.targetY = e.clientY - rect.top;
      hideHint();
    }

    function onPointerEnter() {
      state.targetAlpha = 1;
      hideHint();
    }

    function onPointerLeave() {
      state.targetAlpha = 0;
    }

    function hideHint() {
      if (hint && !hint.classList.contains("is-hidden")) {
        hint.classList.add("is-hidden");
      }
    }

    function tick(now) {
      if (!state.lastTime) state.lastTime = now;
      var dt = Math.min((now - state.lastTime) / 1000, 0.05);
      state.lastTime = now;

      // 位置平滑跟随（指数缓动，速度约 9/s）
      var posK = 1 - Math.exp(-dt * 9);
      state.x += (state.targetX - state.x) * posK;
      state.y += (state.targetY - state.y) * posK;

      // 进入 / 离开时的柔和淡入淡出
      var alphaK = 1 - Math.exp(-dt * 5.5);
      state.alpha += (state.targetAlpha - state.alpha) * alphaK;
      if (state.alpha < 0.004 && state.targetAlpha === 0) state.alpha = 0;

      applySpotlight();
      state.rafId = requestAnimationFrame(tick);
    }

    function applySpotlight() {
      // 没有实质变化时跳过，避免无谓的样式重算
      if (
        Math.abs(state.x - state.lastX) < 0.4 &&
        Math.abs(state.y - state.lastY) < 0.4 &&
        Math.abs(state.alpha - state.lastAlpha) < 0.004
      ) {
        return;
      }
      state.lastX = state.x;
      state.lastY = state.y;
      state.lastAlpha = state.alpha;

      // 位置与透明度写入 CSS 变量，mask 由浏览器原生渐变渲染，流畅且零 base64 开销
      revealLayer.style.setProperty(
        "--spot-x",
        ((state.x / state.rectW) * 100).toFixed(2) + "%"
      );
      revealLayer.style.setProperty(
        "--spot-y",
        ((state.y / state.rectH) * 100).toFixed(2) + "%"
      );
      revealLayer.style.setProperty("--spot-alpha", state.alpha.toFixed(3));
    }

    if (touchDevice) {
      // 触屏设备：默认显示第一张图，点击人像短暂窥视第二张
      if (hint) hint.textContent = "点击 · 查看另一面";
      var peekTimer = null;
      portrait.addEventListener("click", function () {
        state.targetAlpha = 1;
        hideHint();
        clearTimeout(peekTimer);
        peekTimer = setTimeout(function () {
          state.targetAlpha = 0;
        }, 2800);
      });
    } else {
      if (window.PointerEvent) {
        portrait.addEventListener("pointermove", onPointerMove);
        portrait.addEventListener("pointerenter", onPointerEnter);
        portrait.addEventListener("pointerleave", onPointerLeave);
      } else {
        // 极老内核兜底
        portrait.addEventListener("mousemove", onPointerMove);
        portrait.addEventListener("mouseenter", onPointerEnter);
        portrait.addEventListener("mouseleave", onPointerLeave);
      }
    }
    window.addEventListener("resize", sizeWatch);

    if ("ResizeObserver" in window) {
      new ResizeObserver(sizeWatch).observe(portrait);
    }

    sizeWatch();

    // 演示钩子：?demo=spotlight 自动把光斑定位到人像中央（用于截图/自动化验证）
    var demo = new URLSearchParams(window.location.search).get("demo");
    if (demo === "spotlight") {
      var rect = portrait.getBoundingClientRect();
      portrait.dispatchEvent(new PointerEvent("pointerenter", { bubbles: false }));
      portrait.dispatchEvent(
        new PointerEvent("pointermove", {
          bubbles: false,
          clientX: rect.left + rect.width / 2,
          clientY: rect.top + rect.height / 2
        })
      );
    }
    if (demo === "works") return; // 预览模式：不启动动画，便于整页截图

    state.rafId = requestAnimationFrame(tick);
  }
})();
