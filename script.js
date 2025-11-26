// Configuração da API de Meteorologia
// Usando OpenWeatherMap API (requer chave API gratuita)
// Alternativa: usar API pública sem chave (Open-Meteo)

const WEATHER_API_KEY = ''; // Deixe vazio para usar API pública
const DEFAULT_LAT = 39.3939; // Latitude de Marvão, Portalegre
const DEFAULT_LON = -7.3767; // Longitude de Marvão, Portalegre

// Função para obter localização (sempre usa Marvão, Portalegre)
function getLocation() {
    return Promise.resolve({
        lat: DEFAULT_LAT,
        lon: DEFAULT_LON
    });
}

// Função para buscar dados meteorológicos usando Open-Meteo (API pública gratuita)
async function fetchWeatherOpenMeteo(lat, lon) {
    try {
        const response = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,weather_code,precipitation_sum,wind_speed_10m_max&timezone=Europe/Lisbon&forecast_days=5`
        );
        
        if (!response.ok) {
            throw new Error('Erro na resposta da API');
        }
        
        const data = await response.json();
        return {
            current: {
                temperature: Math.round(data.current.temperature_2m),
                feelsLike: Math.round(data.current.apparent_temperature),
                humidity: data.current.relative_humidity_2m,
                windSpeed: Math.round(data.current.wind_speed_10m * 3.6),
                weatherCode: data.current.weather_code
            },
            daily: data.daily.time.map((date, index) => ({
                date: date,
                tempMax: Math.round(data.daily.temperature_2m_max[index]),
                tempMin: Math.round(data.daily.temperature_2m_min[index]),
                weatherCode: data.daily.weather_code[index],
                precipitation: data.daily.precipitation_sum[index],
                windSpeed: Math.round(data.daily.wind_speed_10m_max[index] * 3.6)
            })),
            location: 'Marvão, Portalegre'
        };
    } catch (error) {
        console.error('Erro ao buscar dados do Open-Meteo:', error);
        throw error;
    }
}

// Função para buscar dados meteorológicos usando OpenWeatherMap (requer API key)
async function fetchWeatherOpenWeather(lat, lon) {
    if (!WEATHER_API_KEY) {
        throw new Error('API key não configurada');
    }
    
    try {
        const response = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${WEATHER_API_KEY}&units=metric&lang=pt_br`
        );
        
        if (!response.ok) {
            throw new Error('Erro na resposta da API');
        }
        
        const data = await response.json();
        return {
            temperature: Math.round(data.main.temp),
            feelsLike: Math.round(data.main.feels_like),
            humidity: data.main.humidity,
            windSpeed: Math.round(data.wind.speed * 3.6), // Converter m/s para km/h
            description: data.weather[0].description,
            icon: data.weather[0].icon,
            location: data.name || `${lat.toFixed(2)}, ${lon.toFixed(2)}`
        };
    } catch (error) {
        console.error('Erro ao buscar dados do OpenWeather:', error);
        throw error;
    }
}

// Função para obter ícone e descrição baseado no código do tempo (WMO)
function getWeatherInfo(code) {
    const weatherCodes = {
        0: { icon: '☀️', desc: 'Céu limpo' },
        1: { icon: '🌤️', desc: 'Principalmente claro' },
        2: { icon: '⛅', desc: 'Parcialmente nublado' },
        3: { icon: '☁️', desc: 'Nublado' },
        45: { icon: '🌫️', desc: 'Nevoeiro' },
        48: { icon: '🌫️', desc: 'Nevoeiro com geada' },
        51: { icon: '🌦️', desc: 'Chuva leve' },
        53: { icon: '🌦️', desc: 'Chuva moderada' },
        55: { icon: '🌧️', desc: 'Chuva forte' },
        56: { icon: '🌨️', desc: 'Chuva congelante leve' },
        57: { icon: '🌨️', desc: 'Chuva congelante forte' },
        61: { icon: '🌦️', desc: 'Chuva leve' },
        63: { icon: '🌧️', desc: 'Chuva moderada' },
        65: { icon: '🌧️', desc: 'Chuva forte' },
        66: { icon: '🌨️', desc: 'Chuva congelante leve' },
        67: { icon: '🌨️', desc: 'Chuva congelante forte' },
        71: { icon: '❄️', desc: 'Queda de neve leve' },
        73: { icon: '❄️', desc: 'Queda de neve moderada' },
        75: { icon: '❄️', desc: 'Queda de neve forte' },
        77: { icon: '❄️', desc: 'Grãos de neve' },
        80: { icon: '🌦️', desc: 'Pancadas de chuva leves' },
        81: { icon: '🌧️', desc: 'Pancadas de chuva moderadas' },
        82: { icon: '🌧️', desc: 'Pancadas de chuva fortes' },
        85: { icon: '❄️', desc: 'Pancadas de neve leves' },
        86: { icon: '❄️', desc: 'Pancadas de neve fortes' },
        95: { icon: '⛈️', desc: 'Tempestade' },
        96: { icon: '⛈️', desc: 'Tempestade com granizo' },
        99: { icon: '⛈️', desc: 'Tempestade forte com granizo' }
    };
    
    return weatherCodes[code] || { icon: '☀️', desc: 'Condições desconhecidas' };
}

// Função para formatar data
function formatDate(dateString) {
    const date = new Date(dateString);
    const days = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    const dayName = days[date.getDay()];
    const day = date.getDate();
    const month = date.getMonth() + 1;
    return `${dayName}, ${day}/${month}`;
}

// Função para atualizar a interface com os dados meteorológicos
function updateWeatherUI(data, isOpenMeteo = true) {
    const loadingEl = document.getElementById('weatherLoading');
    const contentEl = document.getElementById('weatherContent');
    const errorEl = document.getElementById('weatherError');
    
    if (loadingEl) loadingEl.style.display = 'none';
    if (errorEl) errorEl.style.display = 'none';
    if (contentEl) contentEl.style.display = 'block';
    
    if (isOpenMeteo && data.current && data.daily) {
        // Atualizar dados atuais
        const tempEl = document.getElementById('temperature');
        if (tempEl) tempEl.textContent = data.current.temperature;
        
        const feelsLikeEl = document.getElementById('feelsLike');
        if (feelsLikeEl) feelsLikeEl.textContent = data.current.feelsLike;
        
        const humidityEl = document.getElementById('humidity');
        if (humidityEl) humidityEl.textContent = data.current.humidity;
        
        const windEl = document.getElementById('windSpeed');
        if (windEl) windEl.textContent = data.current.windSpeed;
        
        const locationEl = document.getElementById('location');
        if (locationEl) locationEl.textContent = data.location;
        
        const iconEl = document.getElementById('weatherIcon');
        const descEl = document.getElementById('weatherDescription');
        const weatherInfo = getWeatherInfo(data.current.weatherCode);
        if (iconEl) iconEl.textContent = weatherInfo.icon;
        if (descEl) descEl.textContent = weatherInfo.desc;
        
        // Atualizar previsão de 5 dias
        const forecastContainer = document.getElementById('weatherForecast');
        if (forecastContainer && data.daily) {
            forecastContainer.innerHTML = '';
            data.daily.forEach((day, index) => {
                const dayInfo = getWeatherInfo(day.weatherCode);
                const dayElement = document.createElement('div');
                dayElement.className = 'forecast-day';
                dayElement.innerHTML = `
                    <div class="forecast-date">${formatDate(day.date)}</div>
                    <div class="forecast-icon">${dayInfo.icon}</div>
                    <div class="forecast-temps">
                        <span class="temp-max">${day.tempMax}°</span>
                        <span class="temp-min">${day.tempMin}°</span>
                    </div>
                    <div class="forecast-desc">${dayInfo.desc}</div>
                    ${day.precipitation > 0 ? `<div class="forecast-precip">💧 ${day.precipitation}mm</div>` : ''}
                `;
                forecastContainer.appendChild(dayElement);
            });
        }
    } else {
        // Fallback para formato antigo (OpenWeatherMap)
        const tempEl = document.getElementById('temperature');
        if (tempEl) tempEl.textContent = data.temperature;
        
        const feelsLikeEl = document.getElementById('feelsLike');
        if (feelsLikeEl) feelsLikeEl.textContent = data.feelsLike;
        
        const humidityEl = document.getElementById('humidity');
        if (humidityEl) humidityEl.textContent = data.humidity;
        
        const windEl = document.getElementById('windSpeed');
        if (windEl) windEl.textContent = data.windSpeed;
        
        const locationEl = document.getElementById('location');
        if (locationEl) locationEl.textContent = data.location;
        
        const iconEl = document.getElementById('weatherIcon');
        const descEl = document.getElementById('weatherDescription');
        if (iconEl) {
            const desc = data.description.toLowerCase();
            if (desc.includes('clear')) iconEl.textContent = '☀️';
            else if (desc.includes('cloud')) iconEl.textContent = '☁️';
            else if (desc.includes('rain')) iconEl.textContent = '🌧️';
            else if (desc.includes('storm')) iconEl.textContent = '⛈️';
            else if (desc.includes('snow')) iconEl.textContent = '❄️';
            else iconEl.textContent = '🌤️';
        }
        if (descEl) descEl.textContent = data.description;
    }
}

// Função para exibir erro
function showWeatherError() {
    const loadingEl = document.getElementById('weatherLoading');
    const contentEl = document.getElementById('weatherContent');
    const errorEl = document.getElementById('weatherError');
    
    if (loadingEl) loadingEl.style.display = 'none';
    if (contentEl) contentEl.style.display = 'none';
    if (errorEl) errorEl.style.display = 'block';
}

// Função principal para carregar dados meteorológicos
async function loadWeather() {
    try {
        const location = await getLocation();
        console.log('Localização obtida:', location);
        let weatherData;
        
        // Tentar usar OpenWeatherMap se tiver API key, senão usar Open-Meteo
        if (WEATHER_API_KEY) {
            try {
                console.log('Tentando buscar dados do OpenWeatherMap...');
                weatherData = await fetchWeatherOpenWeather(location.lat, location.lon);
                updateWeatherUI(weatherData, false);
            } catch (error) {
                console.log('OpenWeatherMap falhou, tentando Open-Meteo...', error);
                // Se falhar, tentar Open-Meteo como fallback
                weatherData = await fetchWeatherOpenMeteo(location.lat, location.lon);
                updateWeatherUI(weatherData, true);
            }
        } else {
            console.log('Usando Open-Meteo API...');
            weatherData = await fetchWeatherOpenMeteo(location.lat, location.lon);
            console.log('Dados recebidos:', weatherData);
            updateWeatherUI(weatherData, true);
        }
    } catch (error) {
        console.error('Erro ao carregar dados meteorológicos:', error);
        showWeatherError();
    }
}

// Carregar dados meteorológicos quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
    loadWeather();
    
    // Atualizar a cada 30 minutos
    setInterval(loadWeather, 30 * 60 * 1000);
});

