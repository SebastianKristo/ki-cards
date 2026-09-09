/* ki-section-card – liten seksjonstittel */
(function (KI) {
  class SkSectionCard extends KI.Card {
    static getStubConfig() { return { title: "Seksjon" }; }
    _key() { return this._config.title; }
    _render() {
      this.shadowRoot.innerHTML = `<style>${KI.css}</style><div class="section">${this._config.title || ""}</div>`;
    }
  }
  customElements.define("ki-section-card", SkSectionCard);
  KI.register("ki-section-card", "KI Section", "Seksjonsoverskrift");
})(window.KI);
