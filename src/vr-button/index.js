import CustomElement from "dlib/dom/CustomElement.js";

import templateContent from "./template.html!text";
let template = document.createElement("template");
template.innerHTML = templateContent;

CustomElement.register("vr-button", template);
