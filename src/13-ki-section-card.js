/* ki-section-card – liten seksjonstittel */
(function (SK) {
  class SkSectionCard extends SK.Card {
    static getStubConfig() { return { title: "Seksjon" }; }
    _key() { return this._config.title; }
    _render() {
      this.shadowRoot.innerHTML = `<style>${SK.css}</style><div class="section">${this._config.title || ""}</div>`;
    }
  }
  customElements.define("ki-section-card", SkSectionCard);
  SK.register("ki-section-card", "KI Section", "Seksjonsoverskrift");
})(window.SK);
