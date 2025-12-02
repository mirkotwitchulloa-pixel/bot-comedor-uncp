const express = require('express');
const puppeteer = require('puppeteer');
const schedule = require('node-schedule');
const app = express();
const PORT = process.env.PORT || 3000;

// CONFIGURACIÓN - EDITAR CON TUS DATOS
const CONFIG = {
    url: 'https://comedor.uncp.edu.pe/charola',
    dni: '60933266',
    codigo: '2024100738J',
    hora: '10:00'
};

async function registroAutomatico() {
    console.log('🚀 [' + new Date().toLocaleString('es-PE') + '] Iniciando registro...');
    
    let browser;
    try {
        browser = await puppeteer.launch({
            headless: 'new',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
                '--window-size=1920,1080'
            ]
        });
        
        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
        
        console.log('🌐 Navegando a la página...');
        await page.goto(CONFIG.url, { 
            waitUntil: 'networkidle2', 
            timeout: 30000 
        });
        console.log('✅ Página cargada');
        await page.waitForTimeout(2000);
        
        // STRATEGY 1: Buscar por placeholder
        let dniEncontrado = false;
        const selectoresDNI = [
            'input[placeholder*="Documento Nacional de Identidad"]',
            'input[placeholder*="DNI"]',
            'input[name*="dni"]',
            'input[id*="dni"]',
            'input[type="text"]'
        ];
        
        for (const selector of selectoresDNI) {
            try {
                const campo = await page.$(selector);
                if (campo) {
                    await campo.click({ clickCount: 3 });
                    await campo.type(CONFIG.dni, { delay: 100 });
                    console.log(`✅ DNI completado: ${CONFIG.dni}`);
                    dniEncontrado = true;
                    break;
                }
            } catch (e) {
                continue;
            }
        }
        
        // Buscar campo CÓDIGO
        let codigoEncontrado = false;
        const selectoresCodigo = [
            'input[placeholder*="Código de Matricula"]',
            'input[placeholder*="Código"]',
            'input[name*="codigo"]',
            'input[id*="codigo"]',
            'input[type="text"]:nth-of-type(2)'
        ];
        
        for (const selector of selectoresCodigo) {
            try {
                const campo = await page.$(selector);
                if (campo) {
                    await campo.click({ clickCount: 3 });
                    await campo.type(CONFIG.codigo, { delay: 100 });
                    console.log(`✅ CÓDIGO completado: ${CONFIG.codigo}`);
                    codigoEncontrado = true;
                    break;
                }
            } catch (e) {
                continue;
            }
        }
        
        if (dniEncontrado && codigoEncontrado) {
            console.log('🎯 Ambos campos completados');
            
            // Buscar botón de envío
            const selectoresBoton = [
                'button[type="submit"]',
                'input[type="submit"]',
                'button',
                '.btn',
                '.btn-primary'
            ];
            
            for (const selector of selectoresBoton) {
                try {
                    const boton = await page.$(selector);
                    if (boton) {
                        await boton.click();
                        console.log('✅ Formulario enviado');
                        await page.waitForTimeout(3000);
                        break;
                    }
                } catch (e) {
                    continue;
                }
            }
            
            console.log('🎉 Proceso de registro completado');
            
        } else {
            console.log('❌ Campos no encontrados completamente');
            console.log(`   DNI: ${dniEncontrado ? '✅' : '❌'}`);
            console.log(`   Código: ${codigoEncontrado ? '✅' : '❌'}`);
        }
        
    } catch (error) {
        console.log('❌ Error:', error.message);
    } finally {
        if (browser) {
            await browser.close();
            console.log('🔄 Navegador cerrado');
        }
    }
}

// Verificar si es día hábil (Lunes a Jueves)
function esDiaHabil() {
    const hoy = new Date();
    const dia = hoy.getDay(); // 0=Domingo, 1=Lunes, ..., 6=Sábado
    return dia >= 1 && dia <= 4; // Lunes=1 a Jueves=4
}

// Programar ejecución automática
function programarRegistro() {
    console.log('⏰ Programando registro automático...');
    
    // Ejecutar todos los días a las 10:00 AM hora Perú
    // Formato: minuto hora día-del-mes mes día-de-la-semana
    // 15:00 UTC = 10:00 AM Perú (UTC-5)
    schedule.scheduleJob('0 15 * * 1-4', async () => {
        const ahora = new Date();
        console.log(`🕙 [${ahora.toLocaleString('es-PE')}] Hora programada alcanzada`);
        
        if (esDiaHabil()) {
            console.log(`📅 Hoy es ${['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'][ahora.getDay()]}, ejecutando...`);
            await registroAutomatico();
        } else {
            console.log(`📅 Hoy es ${['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'][ahora.getDay()]}, NO es día hábil`);
        }
    });
    
    console.log('✅ Bot programado para ejecutarse automáticamente');
}

// Ruta para prueba manual
app.get('/probar', async (req, res) => {
    console.log('🔧 Ejecución manual solicitada');
    await registroAutomatico();
    res.json({ 
        mensaje: 'Registro ejecutado - revisa los logs en Render',
        hora: new Date().toLocaleString('es-PE'),
        estado: 'Proceso completado'
    });
});

// Ruta de estado
app.get('/', (req, res) => {
    const ahora = new Date();
    res.json({
        servicio: '🤖 Bot Comedor UNCP',
        estado: '🟢 Activo y funcionando',
        programado: '⏰ 10:00 AM (Perú) de Lunes a Jueves',
        ultimaActualizacion: ahora.toLocaleString('es-PE'),
        configuracion: {
            url: CONFIG.url,
            horaEjecucion: CONFIG.hora,
            dias: 'Lunes, Martes, Miércoles, Jueves'
        },
        endpoints: {
            prueba: '/probar',
            estado: '/'
        },
        notas: 'Este bot se ejecuta automáticamente. Para pruebas usa /probar'
    });
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log('='.repeat(50));
    console.log('🚀 BOT COMEDOR UNCP INICIADO');
    console.log('='.repeat(50));
    console.log(`📅 Fecha: ${new Date().toLocaleString('es-PE')}`);
    console.log(`🌐 Puerto: ${PORT}`);
    console.log(`🤖 Configurado para: ${CONFIG.url}`);
    console.log(`👤 DNI: ${CONFIG.dni}`);
    console.log(`🎓 Código: ${CONFIG.codigo}`);
    console.log('='.repeat(50));
    
    programarRegistro();
});

// Mantener activo y mostrar logs periódicos
setInterval(() => {
    const ahora = new Date();
    console.log(`💚 [${ahora.toLocaleTimeString('es-PE')}] Bot activo - Esperando próxima ejecución`);
}, 300000); // 5 minutos
