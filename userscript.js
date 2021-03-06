import SuperGif from "./libgif.js"
import css from "./userscript.css"

(function () {
  "use strict";

  let cssAlreadyInjected = false;
  function injectGifControlCSS() {
    if (cssAlreadyInjected) return;
    cssAlreadyInjected = true;
    const style = document.createElement("style");
    style.textContent = css;
    document.head.appendChild(style);
  }

  function addGifControls(imgElem) {
    const gif = new SuperGif({gif: imgElem, auto_play: true});

    function handleGifLoaded() {
      const controlsContainer = gif.get_canvas().parentElement.querySelector(".jsgif_toolbar");
      controlsContainer.style.setProperty("font-family", "sans-serif", "important");
      controlsContainer.style.maxWidth = controlsContainer.style.minWidth;
      controlsContainer.addEventListener("click", e => {
        // Override clicks so our gif controls can still be used
        // even if the gif was e.g. in an <a> tag
        e.preventDefault();
        e.stopPropagation();
      });

      const pBar = document.createElement("div");
      pBar.className = "jsgif-userscript-pbar";
      controlsContainer.appendChild(pBar);

      const lastFrame = gif.get_length() - 1;

      gif.on_frame_change((currentFrame) => {
        if (currentFrame === lastFrame + 1) currentFrame = 0; // circumvent bug in the library
        const percentage = Math.round((currentFrame / lastFrame) * 100) + "%";
        pBar.textContent = currentFrame + "/" + lastFrame + " (" + percentage + ")";
        pBar.style.setProperty("background-image", "linear-gradient(90deg, gray " + percentage + ", #eee " + percentage + ", #eee 100%)", "important");
      });

      let isPressing = false;

      function handlePBar(e) {
        const rect = pBar.getBoundingClientRect();
        const x = e.clientX - rect.x;
        const frame = Math.round((x / rect.width) * lastFrame);
        gif.move_to(frame);
      }

      pBar.addEventListener("mousedown", e => {
        isPressing = true;
        handlePBar(e);
      });
      pBar.addEventListener("mousemove", e => {
        if (!isPressing) return;
        handlePBar(e);
      });
      window.addEventListener("mouseup", () => isPressing = false);

      const buttonContainer = document.createElement("div");
      buttonContainer.className = "jsgif-userscript-btn-container";
      controlsContainer.appendChild((buttonContainer));

      function addButton(text, func) {
        const btn = document.createElement("button");
        btn.className = "jsgif-userscript-btn";
        btn.textContent = text;
        btn.addEventListener("click", func);
        buttonContainer.appendChild(btn);
        return btn;
      }

      addButton("⏸", (e) => {
        if (gif.get_playing()) {
          e.target.innerHTML = "▶";
          gif.pause();
        } else {
          e.target.innerHTML = "⏸";
          gif.play();
        }
      });

      addButton("⬅", () => {
        if (gif.get_current_frame() <= 0) {
          gif.move_to(lastFrame);
        } else {
          gif.move_relative(-1);
        }
      });
      addButton("➡", () => {
        if (gif.get_current_frame() >= lastFrame) {
          gif.move_to(0);
        } else {
          gif.move_relative(1);
        }
      });

      addButton("⏹", () => {
        gif.pause();
        gif.move_to(0);
      });

      const speedDropdown = document.createElement("select");
      [0.25, 0.5, 1, 1.5, 2].forEach(multiplier => {
        const option = document.createElement("option");
        option.textContent = "x" + multiplier;
        option.value = multiplier;
        if (multiplier === 1) option.selected = true;
        speedDropdown.appendChild(option);
      });
      speedDropdown.addEventListener("input", () => {
        gif.set_multiplier(1 / speedDropdown.value);
      });
      buttonContainer.appendChild(speedDropdown);
      injectGifControlCSS();
    }

    gif.load(handleGifLoaded, (e) => {
      if (true || e.target.status === 0) { // Most likely CORS violation
        const xhr = GM_xmlhttpRequest({
          url: imgElem.src,
          method: "GET",
          overrideMimeType: "text/plain; charset=x-user-defined",
          anonymous: true,
          onload: (resp) => {
            if (resp.status !== 200) return;
            unsafeWindow.gifData = resp.response;
            gif.load_raw(resp.response, handleGifLoaded);
          },
          onerror: () => {
            GM_notification({title: "jsgif can't load this image", text: "Reason: Unknown XHR error."});
          }
        });
      } else {
        GM_notification({title: "jsgif can't load this image", text: "Reason: Wrong XHR response code."});
      }
    });
  }

  function addClickListeners() {
    const gifs = document.querySelectorAll('img[src$=".gif"]');

    if (gifs.length > 0) {
      Array.from(gifs).forEach(gif => {
        if (gif.getAttribute("data-jsgif-listeneradded") !== null) return;
        gif.setAttribute("data-jsgif-listeneradded", "");

        gif.addEventListener("click", e => {
          e.preventDefault();
          e.stopPropagation();
          if (gif.complete && typeof gif.naturalWidth != 'undefined' && gif.naturalWidth !== 0) {
            // https://stackoverflow.com/a/1977898/
            addGifControls(gif);
          } else {
            gif.onload = () => addGifControls(gif);
          }
        });
        let origFilter;
        gif.addEventListener("mouseover", () => {
          origFilter = gif.style.filter;
          gif.style.filter = origFilter + "brightness(0.3)";
        });
        gif.addEventListener("mouseout", () => gif.style.filter = origFilter);
      });
    }
  }

  GM_registerMenuCommand("Add Controls", addClickListeners);
})();