import CustomElement from "dlib/dom/CustomElement.js";

import templateContent from "./template.html!text";
let template = document.createElement("template");
template.innerHTML = templateContent;

class VRDom extends CustomElement {
  createdCallback() {
    super.createdCallback();
    Object.assign(this.style, {
      display: "block",
      position: "relative"
    });
    this._split = false;
  }

  attachedCallback() {
    super.attachedCallback();

    for (let styleSheet of Array.from(document.styleSheets)) {
      for (let cssRule of Array.from(styleSheet.cssRules)) {
        let cssText = cssRule.cssText.replace("vr-dom", ":host");
        this.shadowRoot.styleSheets[0].insertRule(cssText, 0);
      }
    }

    let observer = new MutationObserver((mutations) => {
      for (let mutation of mutations) {
        switch (mutation.type) {
          case "childList":
            for (let i = 0, l = mutation.addedNodes.length; i < l; i++) {
              let element = mutation.addedNodes[i];
              if(element.nodeType === Node.TEXT_NODE) {
                element.parentNode._linkedElement.innerText = element.data;
                continue;
              }
              mutation.target._linkedElement.appendChild(cloneAndLinkElement(element));
            };
            for (let removedNode of mutation.removedNodes) {
              removedNode._linkedElement.remove();
            };
            break;
          case "attributes":
            if (mutation.attributeName === "style") {
              copyStyles(mutation.target, mutation.target._linkedElement);
            }
            else if (mutation.attributeName === "class") {
              mutation.target._linkedElement.className = mutation.target.className;
            }
            else {
              mutation.target._linkedElement[mutation.attributeName] = mutation.target[mutation.attributeName];
            }
            break;
          case "characterData":
            mutation.target.parentNode._linkedElement.innerHTML = mutation.target.parentNode.innerHTML;
            break;
        }
        let changedAttribute = mutation.target[mutation.attributeName];
      };
    });

    let mutationObserverConfig = { attributes: true, childList: true, characterData: true};

    // COPY

    let copyStyles = (mainElement, copyElement) => {
      // Old fashion way without need of shadow in css but doesn"t properly copy transitions
      //
      // mainElement.hidden = copyElement.hidden = true;
      // let styleMain = getComputedStyle(mainElement);
      // let styleCopy = getComputedStyle(copyElement);
      // for (let i = 0; i < styleMain.length; i++) {
      //   let property = styleMain[i];
      //   if(styleMain[property] !== styleCopy[property]) {
      //     copyElement.style[property] = styleMain[property];
      //   }
      // };
      // mainElement.hidden = copyElement.hidden = false;
      //

      for (let i = 0; i < mainElement.style.length; i++) {
        let property = mainElement.style[i];
        copyElement.style[property] = mainElement.style[property];
      };
    };

    let cloneAndLinkElement = (element) => {
      let clone = element.cloneNode();

      element._linkedElement = clone;

      observer.observe(element, mutationObserverConfig);

      if(element.style) {
        copyStyles(element, clone);
      }

      let children;
      if(element.childNodes) {
        for (let i = 0; i < element.childNodes.length; i++) {
          clone.appendChild(cloneAndLinkElement(element.childNodes[i]));
        };
      }

      if(element.shadowRoot) {
        observer.observe(element.shadowRoot, mutationObserverConfig);

        clone.shadowRoot.innerHTML = "";
        for (let childNode of element.shadowRoot.childNodes) {
          clone.shadowRoot.appendChild(cloneAndLinkElement(childNode));
        };
      }

      return clone;
    };

    let onElementScroll = (e) => {
      e.target._linkedElement.scrollTop = e.target.scrollTop;
      e.target._linkedElement.scrollLeft = e.target.scrollLeft;
    }

    let sideContent = this.shadowRoot.querySelector("#vr-side-content");
    for (let i = 0; i < this.childNodes.length; i++) {
      sideContent.appendChild(cloneAndLinkElement(this.childNodes[i]));
    };

    this.addEventListener("scroll", onElementScroll, true);
  }

  set split(value) {
    this._split = value;
    if(this._split) {
      this.setAttribute("split", "");
    } else {
      this.removeAttribute("split");
    }
  }

  get split() {
    return this._split;
  }
}

VRDom.register("vr-dom", template);
