from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime, timedelta
import logging
import random
import statistics

logging.basicConfig(level=logging.INFO)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Fare constants (official meter rates) ---
MINIMUM_FARE = 30.00
MINIMUM_DISTANCE_KM = 1.5
RATE_PER_KM = 15.00
RATE_PER_MINUTE = 1.50
LATE_NIGHT_SURCHARGE_PERCENT = 25.0
OVERSIZED_LUGGAGE_FLAT = 25.00
COMMUNITY_BLEND_WEIGHT = 0.4  # 40% community, 60% official

# --- Simulated crowdsourced fare reports from workers ---
random.seed(42)
COMMUNITY_FARE_REPORTS = []
for worker in range(1, 48):
    for _ in range(random.randint(3, 12)):
        distance = round(random.uniform(1.5, 15), 1)
        waiting = random.randint(0, 20)
        late = random.random() < 0.15
        luggage = random.random() < 0.08
        base = MINIMUM_FARE + max(0, distance - MINIMUM_DISTANCE_KM) * random.uniform(14, 17)
        base += waiting * random.uniform(1.2, 2.0)
        if late:
            base *= 1.25
        if luggage:
            base += 25
        COMMUNITY_FARE_REPORTS.append({
            "worker_id": f"w{worker}",
            "distance": distance,
            "waiting": waiting,
            "fare": round(base + random.uniform(-5, 15), 2),
            "late_night": late,
            "oversized_luggage": luggage,
            "recorded_at": (datetime.now() - timedelta(days=random.randint(0, 30))).isoformat(),
        })

# Area safety proxy (0 = safest, 1 = highest risk) — Bangalore-area inspired
AREA_RISK: dict[str, float] = {
    "indiranagar": 0.15,
    "koramangala": 0.18,
    "whitefield": 0.35,
    "electronic city": 0.32,
    "mg road": 0.22,
    "majestic": 0.45,
    "shivajinagar": 0.38,
    "yelahanka": 0.28,
    "jayanagar": 0.16,
    "hebbal": 0.25,
    "marathahalli": 0.30,
    "btm": 0.20,
    "hsr": 0.17,
    "airport": 0.40,
    "downtown": 0.35,
    "city center": 0.30,
}


class JobData(BaseModel):
    fare: float
    distance: float
    time: float
    platform: str
    late_night: bool = False
    oversized_luggage: bool = False


class JobSummary(BaseModel):
    fare: float
    distance: float
    time: float
    platform: str
    late_night: bool = False
    oversized_luggage: bool = False
    underpaid: bool = False
    expected_fare: float = 0
    date: str


class WeeklyInsightsRequest(BaseModel):
    jobs: list[JobSummary]


class SafetyRequest(BaseModel):
    area: str
    hour: int | None = None


class SavingsRequest(BaseModel):
    jobs: list[JobSummary]
    savings_goal: float
    current_savings: float


class AlertData(BaseModel):
    message: str
    location: str


def get_community_benchmark() -> dict:
    fares_per_km = [
        r["fare"] / r["distance"]
        for r in COMMUNITY_FARE_REPORTS
        if r["distance"] > 0
    ]
    waiting_rates = [
        (r["fare"] - MINIMUM_FARE) / r["waiting"]
        for r in COMMUNITY_FARE_REPORTS
        if r["waiting"] > 0
    ]
    short_trips = [r["fare"] for r in COMMUNITY_FARE_REPORTS if r["distance"] <= 2]

    week_ago = datetime.now() - timedelta(days=7)
    recent = [
        r for r in COMMUNITY_FARE_REPORTS
        if datetime.fromisoformat(r["recorded_at"]) >= week_ago
    ]

    return {
        "sample_size": len(COMMUNITY_FARE_REPORTS),
        "worker_count": len({r["worker_id"] for r in COMMUNITY_FARE_REPORTS}),
        "median_fare_per_km": round(statistics.median(fares_per_km), 2),
        "median_waiting_rate": round(statistics.median(waiting_rates) if waiting_rates else RATE_PER_MINUTE, 2),
        "median_minimum_fare": round(statistics.median(short_trips) if short_trips else MINIMUM_FARE, 2),
        "reports_this_week": len(recent),
    }


def community_expected_fare(distance_km: float, waiting_minutes: float, late_night: bool, oversized_luggage: bool) -> float:
    benchmark = get_community_benchmark()
    extra_km = max(0.0, distance_km - MINIMUM_DISTANCE_KM)
    base = benchmark["median_minimum_fare"]
    base += extra_km * benchmark["median_fare_per_km"]
    base += waiting_minutes * benchmark["median_waiting_rate"]
    if late_night:
        base *= 1 + LATE_NIGHT_SURCHARGE_PERCENT / 100
    if oversized_luggage:
        base += OVERSIZED_LUGGAGE_FLAT
    return round(base, 2)


def calculate_expected_fare(
    distance_km: float,
    waiting_minutes: float,
    late_night: bool = False,
    oversized_luggage: bool = False,
    use_community: bool = True,
) -> dict:
    extra_km = max(0.0, distance_km - MINIMUM_DISTANCE_KM)
    distance_charge = extra_km * RATE_PER_KM
    waiting_charge = waiting_minutes * RATE_PER_MINUTE
    base_subtotal = MINIMUM_FARE + distance_charge + waiting_charge

    late_night_surcharge = base_subtotal * (LATE_NIGHT_SURCHARGE_PERCENT / 100) if late_night else 0.0
    luggage_surcharge = OVERSIZED_LUGGAGE_FLAT if oversized_luggage else 0.0
    official_fare = base_subtotal + late_night_surcharge + luggage_surcharge

    community_fare = community_expected_fare(distance_km, waiting_minutes, late_night, oversized_luggage)
    if use_community:
        expected_fare = official_fare * (1 - COMMUNITY_BLEND_WEIGHT) + community_fare * COMMUNITY_BLEND_WEIGHT
    else:
        expected_fare = official_fare

    return {
        "minimum_fare": round(MINIMUM_FARE, 2),
        "distance_charge": round(distance_charge, 2),
        "waiting_charge": round(waiting_charge, 2),
        "base_subtotal": round(base_subtotal, 2),
        "late_night_surcharge": round(late_night_surcharge, 2),
        "luggage_surcharge": round(luggage_surcharge, 2),
        "official_fare": round(official_fare, 2),
        "community_fare": community_fare,
        "expected_fare": round(expected_fare, 2),
    }


def parse_hour_from_area(area: str) -> int | None:
    area_lower = area.lower()
    for token in area_lower.replace(":", " ").split():
        if token.endswith("pm") or token.endswith("am"):
            try:
                h = int("".join(c for c in token if c.isdigit()))
                if "pm" in token and h < 12:
                    h += 12
                if "am" in token and h == 12:
                    h = 0
                return h
            except ValueError:
                pass
        if token.isdigit() and 0 <= int(token) <= 23:
            return int(token)
    return None


def match_area_risk(area: str) -> tuple[str, float]:
    area_lower = area.lower()
    for name, risk in AREA_RISK.items():
        if name in area_lower:
            return name.title(), risk
    return "General area", 0.25


def estimate_work_minutes(job: JobSummary) -> float:
    return job.time + (job.distance / 20) * 60


def filter_jobs_by_days(jobs: list[JobSummary], days: int) -> list[JobSummary]:
    cutoff = datetime.now() - timedelta(days=days)
    return [j for j in jobs if datetime.fromisoformat(j.date.replace("Z", "+00:00").split("+")[0]) >= cutoff]


@app.get("/api/community-benchmark")
async def community_benchmark():
    """Simulated crowdsourced fare data aggregated across 47 workers."""
    data = get_community_benchmark()
    data["description"] = (
        f"Based on {data['sample_size']} fare reports from {data['worker_count']} workers. "
        f"Median fair rate: ₹{data['median_fare_per_km']}/km + ₹{data['median_waiting_rate']}/min waiting."
    )
    return data


@app.post("/api/fairness")
async def check_fairness(job: JobData):
    breakdown = calculate_expected_fare(
        job.distance, job.time, job.late_night, job.oversized_luggage,
    )
    expected_fare = breakdown["expected_fare"]
    is_underpaid = job.fare < expected_fare * 0.98  # 2% tolerance

    return {
        "underpaid": is_underpaid,
        "expected_fare": expected_fare,
        "difference": round(job.fare - expected_fare, 2),
        "breakdown": breakdown,
        "community_adjusted": True,
    }


@app.post("/api/insights/weekly")
async def weekly_insights(request: WeeklyInsightsRequest):
    jobs = request.jobs
    now = datetime.now()
    this_week_start = now - timedelta(days=7)
    last_week_start = now - timedelta(days=14)

    def in_range(job: JobSummary, start: datetime, end: datetime) -> bool:
        d = datetime.fromisoformat(job.date.replace("Z", "").split("+")[0])
        return start <= d < end

    this_week = [j for j in jobs if in_range(j, this_week_start, now)]
    last_week = [j for j in jobs if in_range(j, last_week_start, this_week_start)]

    tw_earnings = sum(j.fare for j in this_week)
    lw_earnings = sum(j.fare for j in last_week)
    pct = ((tw_earnings - lw_earnings) / lw_earnings * 100) if lw_earnings else 0

    tw_underpaid = [j for j in this_week if j.underpaid]
    night_underpaid = [j for j in tw_underpaid if j.late_night]
    night_pct = (len(night_underpaid) / len(tw_underpaid) * 100) if tw_underpaid else 0

    platform_totals: dict[str, float] = {}
    for j in this_week:
        platform_totals[j.platform] = platform_totals.get(j.platform, 0) + j.fare
    top_platform = max(platform_totals, key=platform_totals.get) if platform_totals else "None"

    highlights = []
    if pct < -5:
        highlights.append(f"Earnings dropped {abs(pct):.0f}% compared to last week.")
    elif pct > 5:
        highlights.append(f"Earnings rose {pct:.0f}% compared to last week.")
    else:
        highlights.append("Earnings are steady compared to last week.")

    if tw_underpaid:
        highlights.append(f"{len(tw_underpaid)} job(s) flagged as underpaid this week.")
        if night_pct >= 50:
            highlights.append(f"{night_pct:.0f}% of underpayments happened on late-night trips.")
    else:
        highlights.append("No underpaid jobs detected this week — great work!")

    if platform_totals:
        highlights.append(f"{top_platform} was your top earner with ₹{platform_totals[top_platform]:.0f}.")

    tw_hours = sum(estimate_work_minutes(j) for j in this_week) / 60
    if tw_hours > 0:
        highlights.append(f"Effective rate: ₹{tw_earnings / tw_hours:.0f}/hr across {tw_hours:.1f} hours.")

    if pct < 0 and night_pct >= 50:
        summary = (
            f"You earned {abs(pct):.0f}% less this week, and most of the underpayment "
            f"happened during night shifts. Consider avoiding low-fare late-night runs in "
            f"high-risk areas or negotiating surcharges."
        )
    elif pct < 0:
        summary = (
            f"You earned {abs(pct):.0f}% less this week. "
            f"Review flagged trips and prioritize platforms paying above the community benchmark."
        )
    elif tw_underpaid:
        summary = (
            f"Earnings are up {pct:.0f}% this week, but {len(tw_underpaid)} trip(s) still paid "
            f"below the fair rate. {top_platform} leads your income — keep logging every job."
        )
    else:
        summary = (
            f"Strong week — earnings {'rose' if pct > 0 else 'held steady'} at ₹{tw_earnings:.0f} "
            f"with no underpayment flags. {top_platform} contributed the most."
        )

    return {"summary": summary, "highlights": highlights}


@app.post("/api/safety-score")
async def safety_score(request: SafetyRequest):
    area_name, base_risk = match_area_risk(request.area)
    hour = request.hour if request.hour is not None else parse_hour_from_area(request.area)
    if hour is None:
        hour = datetime.now().hour

    # Time-of-day multiplier: higher risk 10 PM – 5 AM
    if 22 <= hour or hour < 5:
        time_risk = 0.45
        time_label = "late night"
    elif 18 <= hour < 22:
        time_risk = 0.25
        time_label = "evening"
    elif 5 <= hour < 8:
        time_risk = 0.20
        time_label = "early morning"
    else:
        time_risk = 0.08
        time_label = "daytime"

    combined = min(1.0, base_risk * 0.6 + time_risk * 0.4)
    score = max(1, min(10, round(10 - combined * 9)))

    factors = [
        f"Area risk profile: {area_name} ({'moderate' if base_risk > 0.25 else 'low'} congestion/crime proxy)",
        f"Time factor: {time_label} ({hour}:00)",
    ]
    if score >= 7:
        desc = f"{area_name} is generally safe during {time_label}. Stick to well-lit main roads."
        label = "Safe"
    elif score >= 5:
        desc = f"Exercise caution in {area_name} at this hour. Share live location with a contact."
        label = "Moderate"
    else:
        desc = f"Higher risk window for {area_name} at {hour}:00. Avoid isolated routes if possible."
        label = "Caution"

    return {
        "score": score,
        "label": label,
        "description": desc,
        "factors": factors,
    }


@app.post("/api/savings/suggestions")
async def savings_suggestions(request: SavingsRequest):
    recent = filter_jobs_by_days(request.jobs, 14)
    daily_earnings: dict[str, float] = {}
    for job in recent:
        day = job.date[:10]
        daily_earnings[day] = daily_earnings.get(day, 0) + job.fare

    daily_avg = statistics.mean(daily_earnings.values()) if daily_earnings else 0
    remaining = max(0, request.savings_goal - request.current_savings)
    days_to_goal = ceil_days(remaining, daily_avg)

    weekly_target = daily_avg * 7 if daily_avg else request.savings_goal / 4
    suggestions = []

    if request.current_savings >= request.savings_goal:
        suggestions.append("You've hit your savings goal! Consider raising your target.")
    elif daily_avg <= 0:
        suggestions.append("Log more jobs so we can track your earnings trend.")
        suggestions.append(f"Try setting a daily target of ₹{request.savings_goal / 30:.0f} to reach your goal in ~30 days.")
    else:
        suggestions.append(f"Save ₹{daily_avg * 0.3:.0f}/day (30% of your ₹{daily_avg:.0f} daily avg) to stay on track.")
        if days_to_goal:
            suggestions.append(f"At current pace you'll reach ₹{request.savings_goal:.0f} in ~{days_to_goal} days.")
        underpaid = [j for j in recent if j.underpaid]
        if underpaid:
            suggestions.append(f"Recover ₹{sum(max(0, j.expected_fare - j.fare) for j in underpaid):.0f} from {len(underpaid)} underpaid trip(s) by filing complaints.")
        suggestions.append(f"Aim for ₹{weekly_target:.0f}/week across all platforms.")

    summary = (
        f"You've saved ₹{request.current_savings:.0f} of ₹{request.savings_goal:.0f}. "
        + (f"On track in ~{days_to_goal} days." if days_to_goal else "Keep logging jobs to refine projections.")
    )

    return {
        "summary": summary,
        "suggestions": suggestions,
        "projected_days_to_goal": days_to_goal,
        "recommended_weekly_target": round(weekly_target, 2),
    }


def ceil_days(remaining: float, daily_avg: float) -> int | None:
    if remaining <= 0:
        return 0
    if daily_avg <= 0:
        return None
    import math
    return math.ceil(remaining / (daily_avg * 0.3))


@app.post("/api/alert")
async def trigger_alert(alert: AlertData):
    logging.info(f"TWILIO SMS MOCK: Sending alert SMS to trusted contact: '{alert.message}' at {alert.location}")
    return {"status": "success", "message": "Alert sent via Twilio (Mocked due to missing credentials)"}
