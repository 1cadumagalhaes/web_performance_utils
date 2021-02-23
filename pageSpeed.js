class PSIApiUtil {
    /**
     * Starts the PageSpeed Insights API Util
     * @param {string} apiKey - The API key.
     */
    constructor(apiKey) {
        this.API_KEY = apiKey;
        this.API_ENDPOINT = "https://www.googleapis.com/pagespeedonline/v5/runPagespeed"
    }

    /**
     * Query the PSI API for metric records of the last 28 days, for origin or specific url.
     * 
     * @param {String} url - Required. The URL to fetch and analyze.
     * @param {Object} [$0] - Options
     * @param {string} [$0.tipo=] - Type of the request, origin (default) or url.
     * @param {string} [$0.locale=pt-BR] - The locale used to localize formatted results.
     * @param {string} [$0.strategy=desktop] - The analysis strategy (desktop or mobile) to use, and desktop is the default.
     * @param {string} [$0.utm_campaign=null] - Campaign name for analytics. null by default.
     * @param {string} [$0.utm_source=null] - Campaign source for analytics. null by default.
     * 
     * 
     * @returns {{kind: string, loadingExperience?: Object, originLoadingExperience?: Object}} The API Response body. Will have loadingExperience or originLoadingExperience.
     */
    query(url, { tipo = "origin", locale = "pt-BR", strategy = "desktop", utm_campaign = null, utm_source = null } = {}) {
        if (!["origin", "url"].includes(tipo)) throw "Tipo inválido, utilize origin ou url";
        url = `${tipo}:${url}`; //origin|url:https://etc.com
        if (!["desktop", "mobile"].includes(strategy)) throw "Strategy inválido, utilize desktop ou mobile";
        let params = `locale=${locale}&strategy=${strategy}${utm_campaign != null ? '&' + utm_campaign : ''}${utm_source != null ? '&' + utm_source : ''}`
        let URL_API = `${this.API_ENDPOINT}?key=${this.API_KEY}&url=${url}&${params}`;
        const resp = request(URL_API);
        return resp;
    }

    /**
    * Queries the PSI API for a lab test and complete records of the last 28 days, includin origin and specific url data
    * @param {String} url - Required. The URL to fetch and analyze.
    * @param {Object} [$0] - Options
    * @param {string} [$0.category=performance] - A Lighthouse category to run; if none are given, only Performance category will be run.
    * @param {string} [$0.locale=pt-BR] - The locale used to localize formatted results.
    * @param {string} [$0.strategy=desktop] - The analysis strategy (desktop or mobile) to use, and desktop is the default.
    * @param {string} [$0.utm_campaign=null] - Campaign name for analytics. null by default.
    * @param {string} [$0.utm_source=null] - Campaign source for analytics. null by default.
    * @returns {{kind: string, id: string, loadingExperience: Object, originLoadingExperience: Object, lighthouseResult: Object, analysisUTCTimestamp: string}} The API Response body. Will have lighthouseResults, and loadingExperience or originLoadingExperience if available.
    */
    test(url, { category = "performance", locale = "pt-BR", strategy = "desktop", utm_campaign = null, utm_source = null } = {}) {
        if (!["performance", "seo", "best_practices", "accessibility"].includes(category)) throw "Category inválido, consulte https://developers.google.com/speed/docs/insights/rest/v5/pagespeedapi/runpagespeed#Category";
        if (!["desktop", "mobile"].includes(strategy)) throw "Strategy inválido, utilize desktop ou mobile";

        let params = `category=${category}&locale=${locale}&strategy=${strategy}${utm_campaign != null ? '&' + utm_campaign : ''}${utm_source != null ? '&' + utm_source : ''}`
        let URL_API = `${this.API_ENDPOINT}?key=${this.API_KEY}&url=${url}&${params}`;
        const resp = request(URL_API);
        return resp;
    }

    /**
     * Formats the API response to use lightHouseResult and loadingExperience values and details.
     * @param {Object} psi_response - Required. Response from the Test API.
     * @param {String} marca  - Optional. Name of the site.
     * 
     * @returns {Object} Object with all performance dimension values, including lighthouseResult and loadingExperience.
     */
    formatPSIResult(psi_response, marca = "") {
        if (!psi_response) throw "Resposta inválida";

        let { lighthouseResult, loadingExperience, id } = psi_response;
        const LHREsult = lighthouseResult ? this._formatLightHouseResult(lighthouseResult) : null;
        const LEResult = loadingExperience ? this._formatLoadingResult(loadingExperience) : null;
        let objBase = {
            'Data': lighthouseResult.fetchTime.slice(0, 10),
            'Marca': marca,
            'Site': id,
        }
        if (LHREsult) objBase = { ...objBase, ...LHREsult };
        if (LEResult) objBase = { ...objBase, ...LEResult };
        return objBase;
    }

    /**
     * Util to extract all numeric values from the lighthouse result variable.
     * @param {Object} lighthouseResult
     * @param {Object} lighthouseResult.audits 
     * @param {Object} lighthouseResult.categories 
     * @param {Object} lighthouseResult.configSettings 
     * @returns {Object} LHREsult
     */
    _formatLightHouseResult({ audits, categories, configSettings }) {
        let score = this._calcTotalScore(audits, categories);

        return {
            'Device': configSettings.formFactor,
            'Score': score ? score : 0,
            'Lab_FCP': audits['first-contentful-paint'].numericValue,
            'Lab_FMP': audits['first-meaningful-paint'].numericValue,
            'Lab_FCPUIdle': audits['first-cpu-idle'].numericValue,
            'Lab_SpeedIndex': audits['speed-index'].numericValue,
            'Lab_TTI': audits['interactive'].numericValue,
            'Lab_InputLatency': audits['estimated-input-latency'].numericValue,
            'Lab_TTFB': audits['server-response-time'].numericValue,
            'Lab_RenderBlocking': audits['render-blocking-resources'].numericValue,
            'Lab_TBT': audits['total-blocking-time'].numericValue,
            'Lab_CLS': audits['cumulative-layout-shift'].numericValue,
            'Lab_LCP': audits['largest-contentful-paint'].numericValue,
        }
    }

    /**
     * Util to extract all values and categories the Crux loadingResult variable.
     * @param {Object} loadingExperience
     * @param {Object} loadingExperience.audits 
     * @param {Object} loadingExperience.categories 
     * @param {Object} loadingExperience.configSettings 
     * @returns {Object} LEResult
     */
    _formatLoadingResult({ metrics, overall_category }) {
        let { CUMULATIVE_LAYOUT_SHIFT_SCORE, FIRST_CONTENTFUL_PAINT_MS, FIRST_INPUT_DELAY_MS, LARGEST_CONTENTFUL_PAINT_MS } = metrics;

        return {
            'Loading_CLS_Category': CUMULATIVE_LAYOUT_SHIFT_SCORE.category || "N/A",
            'Loading_CLS': CUMULATIVE_LAYOUT_SHIFT_SCORE.percentile || 0,
            'Loading_FCP_Category': FIRST_CONTENTFUL_PAINT_MS.category || "N/A",
            'Loading_FCP': FIRST_CONTENTFUL_PAINT_MS.percentile || 0,
            'Loading_FID_Category': FIRST_INPUT_DELAY_MS.category || "N/A",
            'Loading_FID': FIRST_INPUT_DELAY_MS.percentile || 0,
            'Loading_LCP_Category': LARGEST_CONTENTFUL_PAINT_MS.category || "N/A",
            'Loading_LCP': LARGEST_CONTENTFUL_PAINT_MS.percentile || 0,
            'Loading_Overall_Category': overall_category || "N/A"
        }
    }
    /**
     * Calculate Lighthouse performance score
     * @param {Object} audits - Required. Part of the lighthouseResults response.
     * @param {Object} categories - Required. Part of the lighthouseResults response.
     * @returns {number} lightHouseScore.
     */
    _calcTotalScore(audits, categories) {
        return Object.keys(audits).reduce((lightHouseScore, metric) => {
            let filteredCategoryById = categories.performance.auditRefs.filter(category => {
                return category.id == audits[metric].id
            });
            let weight = filteredCategoryById.length > 0 ? filteredCategoryById[0].weight : 0;
            return lightHouseScore + (audits[metric].score * weight);
        }, 0);
    }
}
