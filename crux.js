class CrUXApiUtil {
    /**
     * Starts the CrUX Util.
     * @param {String} apiKey - The API key.
     */
    constructor(apiKey) {
        this.API_KEY = apiKey;
        this.API_ENDPOINT = "https://chromeuxreport.googleapis.com/v1/records:queryRecord"
    }

    /**
     * Queries the CrUX API for metric records.
     * 
     * Adapted from [CrUX Report API](https://developers.google.com/web/tools/chrome-user-experience-report/api/guides/getting-started).
     * @param {String} site -  Required. The URL to fetch and analyze.
     * @param {Object} [$0] - Options.
     * @param {String} [$0.tipo=origin] - Type of the request, origin (default) or url.
     * @param {String} [$0.formFactor=null] - DESKTOP, PHONE or TABLET. null by default (retrieves all data).
     * @returns {{record: {key: Object, metrics: Map<string, {histogram: Array<{ start: number, end?: number, density: number}>}>}, urlNormalizationDetails: Object}}
     */
    query(site, { tipo = "origin", formFactor = null } = {}) {

        let body = {};
        if (!["origin", "url"].includes(tipo)) throw "Tipo inválido, utilize origin ou url";
        body[tipo] = site;
        if (formFactor && ["DESKTOP", "PHONE", "TABLET"].includes(formFactor)) body["formFactor"] = formFactor;
        const URL_API = `${this.API_ENDPOINT}?key=${this.API_KEY}`;
        const resp = request(URL_API, {
            method: 'POST',
            body: body,
        });

        return resp;
    }
}
