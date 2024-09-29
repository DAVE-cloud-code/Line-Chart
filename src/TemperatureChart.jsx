import React, { useState, useEffect, useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import { useNavigate } from 'react-router-dom'; // To navigate to past data page
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
);

const TemperatureChart = ({ city }) => {
    const [temperatureData, setTemperatureData] = useState([]);
    const [labels, setLabels] = useState([]);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [days, setDays] = useState(7); // Allows dynamic date range
    const navigate = useNavigate();

    // Handle selecting number of days
    const handleDaysChange = (event) => {
        setDays(event.target.value);
    };

    // Get current location (latitude & longitude)
    const getCurrentLocation = () => {
        return new Promise((resolve, reject) => {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        const { latitude, longitude } = position.coords;
                        resolve({ latitude, longitude });
                    },
                    (error) => {
                        reject(new Error(`Geolocation error: ${error.message}`));
                    }
                );
            } else {
                reject(new Error('Geolocation is not supported by this browser.'));
            }
        });
    };

    // Fetch temperature data for the selected number of days
    const fetchTemperatureData = async (lat, lon) => {
        setIsLoading(true);
        try {
            const today = new Date();
            const startDate = new Date(today.setDate(today.getDate() - days)).toISOString().split('T')[0];
            const endDate = new Date().toISOString().split('T')[0];

            const cachedData = localStorage.getItem(`temperature_${lat}_${lon}_${days}`);
            if (cachedData) {
                const parsedData = JSON.parse(cachedData);
                setTemperatureData(parsedData.temperatureData);
                setLabels(parsedData.labels);
                setIsLoading(false);
                return;
            }

            const weatherResponse = await fetch(
                `https://meteostat.p.rapidapi.com/point/daily?lat=${lat}&lon=${lon}&alt=184&start=${startDate}&end=${endDate}`,
                {
                    method: 'GET', 
                    headers: {
                        'X-RapidAPI-Key':'a3b5927ab6msha3a401cf77525e5p1aad6djsn0adf0a8a5054',
                        'X-RapidAPI-Host': 'meteostat.p.rapidapi.com',
                    },
                } 
            );

            const weatherData = await weatherResponse.json();
            const dailyData = weatherData.data

            const temps = dailyData.map((day) => day.tavg);
            const daysList = dailyData.map((day) => day.date);

            setTemperatureData(temps);
            setLabels(daysList);

            // Store data in localStorage
            localStorage.setItem(
                `tavg_${lat}_${lon}_${days}`,
                JSON.stringify({ labels: daysList, temperatureData: temps })
            );

            setIsLoading(false);
        } catch (error) {
            console.error('Error fetching temperature data:', error);
            setError('Failed to load temperature data. Please try again later.');
            setIsLoading(false);
        }
    };

    // Fetch coordinates and temperature based on the city or user's current location
    const fetchCoordinatesAndTemperature = async () => {
        try {
            if (city) {
                const geoResponse = await fetch(
                    `https://api.geoapify.com/v1/geocode/search?text=${city}&apiKey=49307aec154f434db7bbbd73e609f526`
                );
                const geoData = await geoResponse.json();
                const [lon, lat] = geoData.features[0].geometry.coordinates;
                fetchTemperatureData(lat, lon);
            } else {
                const coords = await getCurrentLocation();
                fetchTemperatureData(coords.latitude, coords.longitude);
            }
        } catch (err) {
            setError(err.message);
        }
    };

    useEffect(() => {
        fetchCoordinatesAndTemperature();
    }, [city, days]); // Re-fetch when the city or days change

    const chartData = useMemo(() => ({
        labels: labels,
        datasets: [
            {
                label: `Temperature Report (Last ${days} Days)`,
                data: temperatureData,
                borderColor: 'rgba(75, 192, 192, 1)',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                tension: 0.3,
            },
        ],
    }), [labels, temperatureData]);

    const options = {
        responsive: true,
        plugins: {
            legend: {
                display: false,
            },
            title: {
                display: true,
                text: `Temperature Report (Last ${days} Days)`,
                font: {
                    size: 20,
                },
            },
        },
        scales: {
            y: {
                beginAtZero: false,
                title: {
                    display: true,
                    text: 'Temperature (°C)',
                    font: {
                        size: 16,
                    },
                },
            },
            x: {
                title: {
                    display: true,
                    text: 'Date',
                    font: {
                        size: 16,
                    },
                },
            },
        },
    };

    // Navigate to the past data page
    const handleViewPastData = () => {
        navigate('/past-data', { state: { labels, temperatureData } });
    };

    return (
        <div className="container mx-auto p-4">
            {error ? (
                <p className="text-red-500 text-center">Error: {error}</p>
            ) : isLoading ? (
                <p className="text-center">Loading...</p>
            ) : (
                <div>
                    <h1 className="text-center text-2xl font-bold mb-4">
                        Temperature Data
                    </h1>
                    <div>
                        <label htmlFor="days">Select Days: </label>
                        <select id="days" value={days} onChange={handleDaysChange}>
                            <option value="7">7 Days</option>
                            <option value="14">14 Days</option>
                            <option value="30">30 Days</option>
                        </select>
                    </div>
                    <div className="bg-white p-6 shadow-lg rounded-lg">
                        <Line data={chartData} options={options} />
                    </div>
                    <button
                        className="mt-4 bg-blue-500 text-white px-4 py-2 rounded"
                        onClick={handleViewPastData}
                    >
                        View Past Data
                    </button>
                </div>
            )}
        </div>
    );
};

export default TemperatureChart;