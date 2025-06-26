import { useState, useEffect } from "react";
import Grid from "@mui/material/Unstable_Grid2";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import Prayer from "./Prayer";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";
import axios from "axios";
import moment from "moment";
import "moment/dist/locale/ar";

moment.locale("ar");

export default function MainContent() {
	const [timings, setTimings] = useState({});
	const [selectedCity, setSelectedCity] = useState({
		displayName: "القاهرة",
		apiName: "Cairo",
	});
	const [today, setToday] = useState("");
	const [nextPrayer, setNextPrayer] = useState(null);
	const [remainingTime, setRemainingTime] = useState("");

	const availableCities = [
		{ displayName: "القاهرة", apiName: "Cairo" },
		{ displayName: "القليوبية", apiName: "Qalyubia" },
		{ displayName: "الإسكندرية", apiName: "Alexandria" },
	];

	const prayersArray = [
		{ key: "Fajr", displayName: "الفجر", image: "/Imgs/Fajr.webp" },
		{ key: "Dhuhr", displayName: "الظهر", image: "/Imgs/Dhuhr.png" },
		{ key: "Asr", displayName: "العصر", image: "/Imgs/Asr.jfif" },
		{ key: "Sunset", displayName: "المغرب", image: "/Imgs/Sunset.jpg" },
		{ key: "Isha", displayName: "العشاء", image: "/Imgs/Isha.webp" },
	];

	useEffect(() => {
		fetchTimings();
	}, [selectedCity]);

	useEffect(() => {
		const timer = setInterval(() => {
			updateTime();
		}, 1000);

		updateTime();

		return () => clearInterval(timer);
	}, [timings]);

	const fetchTimings = async () => {
		try {
			const response = await axios.get(`https://api.aladhan.com/v1/timingsByCity?country=EG&city=${selectedCity.apiName}`);
			setTimings(response.data.data.timings);
		} catch (error) {
			console.error("خطأ أثناء جلب مواقيت الصلاة:", error);
		}
	};

	const updateTime = () => {
		const now = moment();
		setToday(now.format("MMM Do YYYY | h:mm:ss"));

		const upcomingPrayer = getNextPrayer(now);
		if (upcomingPrayer) {
			setNextPrayer(upcomingPrayer);
			const nextPrayerTime = moment(timings[upcomingPrayer.key], "HH:mm").set({
				year: now.year(),
				month: now.month(),
				date: now.date()
			});
			let diff = nextPrayerTime.diff(now);

			if (diff < 0) {
				diff = nextPrayerTime.add(1, "day").diff(now);
			}

			const duration = moment.duration(diff);
			setRemainingTime(`${duration.seconds().toString().padStart(2, "0")} : ${duration.minutes().toString().padStart(2, "0")} : ${duration.hours().toString().padStart(2, "0")}`);
		}
	};

	const getNextPrayer = (now) => {
		for (let i = 0; i < prayersArray.length; i++) {
			const prayerTime = moment(timings[prayersArray[i].key], "HH:mm").set({
				year: now.year(),
				month: now.month(),
				date: now.date()
			});
			if (now.isBefore(prayerTime)) {
				return prayersArray[i];
			}
		}
		return prayersArray[0];
	};

	const handleCityChange = (event) => {
		const city = availableCities.find(c => c.apiName === event.target.value);
		if (city) setSelectedCity(city);
	};

	return (
		<>
			<Grid container spacing={2} alignItems="center">
				<Grid xs={6}>
					<h2>{today}</h2>
					<h1>{selectedCity.displayName}</h1>
				</Grid>
				<Grid xs={6}>
					{nextPrayer && (
						<>
							<h2>متبقي حتى صلاة {nextPrayer.displayName}</h2>
							<h1>{remainingTime}</h1>
						</>
					)}
				</Grid>
			</Grid>

			<Divider style={{ borderColor: "white", opacity: "0.1", margin: "20px 0" }} />

			<Stack direction="row" justifyContent="space-around" flexWrap="wrap" gap={2} marginTop={4}>
				{prayersArray.map(prayer => (
					<Prayer
						key={prayer.key}
						name={prayer.displayName}
						time={moment(timings[prayer.key], "HH:mm").set({
							year: moment().year(),
							month: moment().month(),
							date: moment().date()
						}).format("h:mm")} // عرض بتنسيق 12 ساعة بدون AM/PM
						image={prayer.image}
					/>
				))}
			</Stack>

			<Stack direction="row" justifyContent="center" marginTop={4}>
				<FormControl style={{ width: "200px" }}>
					<InputLabel id="city-select-label" style={{ color: "white" }}>المدينة</InputLabel>
					<Select
						labelId="city-select-label"
						style={{ color: "white" }}
						value={selectedCity.apiName}
						onChange={handleCityChange}
					>
						{availableCities.map(city => (
							<MenuItem key={city.apiName} value={city.apiName}>
								{city.displayName}
							</MenuItem>
						))}
					</Select>
				</FormControl>
			</Stack>
		</>
	);
}
