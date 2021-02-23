const CRUX_API_KEY = "[API_KEY]";
const PSI_API_KEY = "[API_KEY]";
const sheets = {
    options: "Options",
    base: "Base"
}

/**
 * Função para testar os utils usando o web.dev como padrão.
 */

function test() {
    const site = 'https://web.dev';
    const strategy = "mobile";
    try {
        /*
        let crux = new CrUXApiUtil(CRUX_API_KEY);
        let crux_response = crux.query(site, {
            tipo: "origin"
        })
        console.log(JSON.stringify(crux_response, null, 2));
        */
        let psi = new PSIApiUtil(PSI_API_KEY);
        const psi_response = psi.test(site, { strategy });

        console.log(JSON.stringify(psi_response, null, 2));
    } catch (error) {
        console.error(error);
    }

}

/**
 * Executa as duas API's para cada uma das URL e tipo disponíveis na aba sheet.options.
 */
function getUrls() {

    const psi = new PSIApiUtil(PSI_API_KEY);
    const urls = getObjectsFromSheets(sheets.options);
    urls.forEach(async function ({ Tipo, URL, Marca, Strategy }) {
        try {
            ((Strategy == "ambos" || !Strategy) ? ["desktop", "mobile"] : [Strategy]).forEach(async strategy => {
                console.log("Iniciando requisição", Marca);
                let psi_response = psi.test(URL, { strategy: strategy });
                //console.log(JSON.stringify(psi_response, null, 2));
                if (psi_response) {
                    const json = psi.formatPSIResult(psi_response, Marca);
                    await writeObjectListToSheet(json, sheets.base, true);
                    console.log("Escreveu", Marca, Strategy);
                }
            })
        } catch (error) {
            console.error(error);
        }
    });
}