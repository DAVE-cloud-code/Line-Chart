import React, { useState, useEffect, useMemo } from 'react';
import { Line } from 'react-chartjs-2';
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

const TemperatureChart = () => {
    const [city, setCity] = useState('');  // Input city
    const [temperatureData, setTemperatureData] = useState([]);
    const [labels, setLabels] = useState([]);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [startDate, setStartDate] = useState('');  // Start date for range
    const [endDate, setEndDate] = useState('');      // End date for range

    // Automatically set startDate to 30 days before current date
    useEffect(() => {
        const today = new Date();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(today.getDate() - 7);

        setStartDate(thirtyDaysAgo.toISOString().split('T')[0]);
        setEndDate(today.toISOString().split('T')[0]);
    }, []);

    // Handle input change for city
    const handleCityChange = (event) => {
        setCity(event.target.value);
    };

    // Handle date input changes
    const handleStartDateChange = (event) => {
        setStartDate(event.target.value);
    };

    const handleEndDateChange = (event) => {
        setEndDate(event.target.value);
    };

    // Fetch coordinates based on city input
    const fetchCoordinatesAndTemperature = async () => {
        if (!city) {
            setError('Please enter a city');
            return;
        }
        if (!startDate || !endDate) {
            setError('Please select a valid date range');
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            // Fetch city coordinates using Geoapify
            const geoResponse = await fetch(
                `https://api.geoapify.com/v1/geocode/search?text=${city}&apiKey=49307aec154f434db7bbbd73e609f526`
            );
            const geoData = await geoResponse.json();

            if (geoData.features.length === 0) {
                throw new Error('City not found');
            }

            // Extract latitude and longitude
            const [lon, lat] = geoData.features[0].geometry.coordinates;

            // Fetch temperature data using the coordinates and date range
            await fetchTemperatureData(lat, lon);
        } catch (err) {
            setError(err.message);
            setIsLoading(false);
        }
    };

    // Fetch temperature data using coordinates and date range
    const fetchTemperatureData = async (lat, lon) => {
        try {
            const weatherResponse = await fetch(
                `https://meteostat.p.rapidapi.com/point/daily?lat=${lat}&lon=${lon}&start=${startDate}&end=${endDate}`,
                {
                    method: 'GET',
                    headers: {
                        'X-RapidAPI-Key': 'a3b5927ab6msha3a401cf77525e5p1aad6djsn0adf0a8a5054',
                        'X-RapidAPI-Host': 'meteostat.p.rapidapi.com',
                    },
                }
            );
            const weatherData = await weatherResponse.json();
            const dailyData = weatherData.data;

            const temps = dailyData.map((day) => day.tavg);
            const daysList = dailyData.map((day) => day.date);

            setTemperatureData(temps);
            setLabels(daysList);
            setIsLoading(false);
        } catch (error) {
            setError('Failed to fetch temperature data');
            setIsLoading(false);
        }
    };

    const chartData = useMemo(
        () => ({
            labels: labels,
            datasets: [
                {
                    label: `Temperature in ${city}`,
                    data: temperatureData,
                    borderColor: 'rgba(75, 192, 192, 1)',
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    tension: 0.3,
                },
            ],
        }),
        [labels, temperatureData, startDate, endDate]
    );

    const options = {
        responsive: true,
        plugins: {
            legend: {
                display: false,
            },
            title: {
                display: true,
                text: `Temperature Data for ${city} (${startDate} to ${endDate})`,
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

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-center text-2xl font-bold mb-4">Temperature Data</h1>
            <div className="mb-4">
                <input
                    type="text"
                    value={city}
                    onChange={handleCityChange}
                    placeholder="Enter a city"
                    className="border rounded p-2 w-full"
                />
                <div className="flex mt-4">
                    <div className="mr-4">
                        <label>Start Date:</label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={handleStartDateChange}
                            className="border rounded p-2"
                        />
                    </div>
                    <div>
                        <label>End Date:</label>
                        <input
                            type="date"
                            value={endDate}
                            onChange={handleEndDateChange}
                            className="border rounded p-2"
                        />
                    </div>
                </div>
                <button
                    className="mt-4 bg-blue-500 text-white px-4 py-2 rounded"
                    onClick={fetchCoordinatesAndTemperature}
                >
                    Get Temperature Data
                </button>
            </div>

            {error ? (
                <p className="text-red-500 text-center">{error}</p>
            ) : isLoading ? (
                <p className="text-center">Loading...</p>
            ) : temperatureData.length > 0 ? (
                <div className="bg-white p-6 shadow-lg rounded-lg">
                    <Line data={chartData} options={options} />
                </div>
            ) : (
                <p className="text-center">No data available. Please enter a city.</p>
            )}
        </div>
    );
};

export default TemperatureChart;