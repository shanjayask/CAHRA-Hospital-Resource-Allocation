from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import joblib
import os
import pandas as pd

app = FastAPI(title="CAHRA AI Backend")

# --------------------------------------------------
# CORS
# --------------------------------------------------

# Allow override via environment variable for production deployments.
# Format: comma-separated origins, e.g. "https://myapp.vercel.app,http://localhost:5173"
_cors_env = os.environ.get("CORS_ORIGINS", "")
_default_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://cahra-hospital-resource-allocation.vercel.app",
]
_allowed_origins = (
    [o.strip() for o in _cors_env.split(",") if o.strip()]
    if _cors_env
    else _default_origins
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --------------------------------------------------
# LOAD TRAINED MODEL
# --------------------------------------------------

MODEL_PATH = os.path.join(
    os.path.dirname(__file__),
    "CAHRA_gradient_boosting_model.pkl"
)

model = joblib.load(MODEL_PATH)

# EXACT feature order used during model training
FEATURES = [
    "admissions",
    "occupancy",
    "icu_demand",
    "AQI",
    "pm25",
    "pm10",
    "no2",
    "so2",
    "co",
    "ozone",
    "max_temp",
    "min_temp",
    "humidity",
    "day_of_week",
    "month",
    "day_of_month",
    "lag_1",
    "lag_2",
    "lag_3",
    "lag_7",
    "rolling_3",
    "rolling_7",
]


# --------------------------------------------------
# ROOT
# --------------------------------------------------

@app.get("/")
def root():
    return {
        "message": "CAHRA AI Backend is running",
        "model_loaded": True,
        "model": "HistGradientBoostingRegressor"
    }


# --------------------------------------------------
# HEALTH CHECK
# --------------------------------------------------

@app.get("/health")
def health():
    return {
        "status": "healthy",
        "model_loaded": True
    }


# --------------------------------------------------
# REAL AI PREDICTION
# --------------------------------------------------

@app.post("/predict")
def predict(data: dict):

    # Check for missing features
    missing_features = [
        feature for feature in FEATURES
        if feature not in data
    ]

    if missing_features:
        return {
            "success": False,
            "error": "Missing required model features",
            "missing_features": missing_features
        }

    # Create dataframe in EXACT training order
    input_data = pd.DataFrame(
        [[data[feature] for feature in FEATURES]],
        columns=FEATURES
    )

    # Run trained CAHRA model
    prediction = model.predict(input_data)[0]

    # Prevent negative patient prediction
    prediction = max(0, float(prediction))

    return {
        "success": True,
        "predicted_admissions": round(prediction, 2),
        "model": "HistGradientBoostingRegressor"
    }


# --------------------------------------------------
# RESOURCE CONSTRAINT SIMULATION
# --------------------------------------------------

@app.post("/simulate")
def simulate(data: dict):

    # Scenario demand selected by the user
    predicted_admissions = float(
        data.get("predicted_admissions", 0)
    )

    # Current available resources from Scenario Lab
    bed_availability = float(
        data.get("bed_availability", 100)
    )

    icu_availability = float(
        data.get("icu_availability", 20)
    )

    nurse_availability = float(
        data.get("nurse_availability", 60)
    )

    doctor_availability = float(
        data.get("doctor_availability", 30)
    )

    ventilator_availability = float(
        data.get("ventilator_availability", 25)
    )

    # --------------------------------------------------
    # CAHRA MODELED RESOURCE CAPACITIES
    # --------------------------------------------------

    total_beds = 100
    total_icu = 20
    total_nurses = 60
    total_doctors = 30
    total_ventilators = 25

    # --------------------------------------------------
    # PLANNING ASSUMPTIONS
    # --------------------------------------------------

    icu_ratio = 0.20
    ventilator_ratio = 0.05
    nurse_ratio = 0.60
    doctor_ratio = 0.30

    # --------------------------------------------------
    # PROJECTED RESOURCE REQUIREMENTS
    # --------------------------------------------------

    predicted_beds = predicted_admissions

    predicted_icu = (
        predicted_admissions * icu_ratio
    )

    predicted_ventilators = (
        predicted_admissions * ventilator_ratio
    )

    predicted_nurses = (
        predicted_admissions * nurse_ratio
    )

    predicted_doctors = (
        predicted_admissions * doctor_ratio
    )

    # --------------------------------------------------
    # UTILIZATION
    # --------------------------------------------------

    bed_utilization = (
        predicted_beds / max(bed_availability, 1)
    ) * 100

    icu_utilization = (
        predicted_icu / max(icu_availability, 1)
    ) * 100

    nurse_utilization = (
        predicted_nurses / max(nurse_availability, 1)
    ) * 100

    doctor_utilization = (
        predicted_doctors / max(doctor_availability, 1)
    ) * 100

    ventilator_utilization = (
        predicted_ventilators /
        max(ventilator_availability, 1)
    ) * 100

    # --------------------------------------------------
    # SHORTAGES
    # --------------------------------------------------

    bed_shortage = max(
        0,
        predicted_beds - bed_availability
    )

    icu_shortage = max(
        0,
        predicted_icu - icu_availability
    )

    nurse_shortage = max(
        0,
        predicted_nurses - nurse_availability
    )

    doctor_shortage = max(
        0,
        predicted_doctors - doctor_availability
    )

    ventilator_shortage = max(
        0,
        predicted_ventilators - ventilator_availability
    )

    # --------------------------------------------------
    # FIND BOTTLENECK
    # --------------------------------------------------

    utilization = {
        "Beds": bed_utilization,
        "ICU": icu_utilization,
        "Nurses": nurse_utilization,
        "Doctors": doctor_utilization,
        "Ventilators": ventilator_utilization,
    }

    bottleneck = max(
        utilization,
        key=utilization.get
    )

    # --------------------------------------------------
    # PLANNING LEVEL
    # --------------------------------------------------

    if (
        bed_utilization >= 100
        or icu_utilization >= 100
        or ventilator_utilization >= 100
        or nurse_utilization >= 100
        or doctor_utilization >= 100
    ):
        planning_level = "CRITICAL"

    elif (
        bed_utilization >= 70
        or icu_utilization >= 70
        or ventilator_utilization >= 70
        or nurse_utilization >= 70
        or doctor_utilization >= 70
    ):
        planning_level = "PREPARE"

    elif (
        bed_utilization >= 50
        or icu_utilization >= 50
        or ventilator_utilization >= 50
        or nurse_utilization >= 50
        or doctor_utilization >= 50
    ):
        planning_level = "WATCH"

    else:
        planning_level = "STABLE"

    # --------------------------------------------------
    # RECOMMENDATIONS
    # --------------------------------------------------

    recommendations = []

    if bed_shortage > 0:
        recommendations.append(
            f"Prepare {round(bed_shortage)} additional beds."
        )

    if icu_shortage > 0:
        recommendations.append(
            f"Prepare {round(icu_shortage)} additional ICU beds."
        )

    if nurse_shortage > 0:
        recommendations.append(
            f"Prepare {round(nurse_shortage)} additional nurses."
        )

    if doctor_shortage > 0:
        recommendations.append(
            f"Prepare {round(doctor_shortage)} additional doctors."
        )

    if ventilator_shortage > 0:
        recommendations.append(
            f"Prepare {round(ventilator_shortage)} additional ventilators."
        )

    if not recommendations:
        recommendations.append(
            "Current modeled resources are sufficient for this scenario."
        )

    # --------------------------------------------------
    # RESPONSE
    # --------------------------------------------------

    return {
        "success": True,

        "predicted_beds": round(predicted_beds, 2),
        "predicted_icu": round(predicted_icu, 2),
        "predicted_nurses": round(predicted_nurses, 2),
        "predicted_doctors": round(predicted_doctors, 2),
        "predicted_ventilators": round(
            predicted_ventilators,
            2
        ),

        "bed_utilization": round(
            bed_utilization,
            2
        ),
        "icu_utilization": round(
            icu_utilization,
            2
        ),
        "nurse_utilization": round(
            nurse_utilization,
            2
        ),
        "doctor_utilization": round(
            doctor_utilization,
            2
        ),
        "ventilator_utilization": round(
            ventilator_utilization,
            2
        ),

        "bed_shortage": round(
            bed_shortage,
            2
        ),
        "icu_shortage": round(
            icu_shortage,
            2
        ),
        "nurse_shortage": round(
            nurse_shortage,
            2
        ),
        "doctor_shortage": round(
            doctor_shortage,
            2
        ),
        "ventilator_shortage": round(
            ventilator_shortage,
            2
        ),

        "planning_level": planning_level,
        "bottleneck": bottleneck,
        "recommendations": recommendations,
    }


# --------------------------------------------------
# MODEL METRICS
# Source: backend/CAHRA_model_metrics.json
# Produced by the CAHRA Colab training run on the real hospital dataset.
# These values are NOT computed at runtime — they are the verified
# results from chronological held-out test / validation evaluation.
# --------------------------------------------------

METRICS_PATH = os.path.join(os.path.dirname(__file__), "CAHRA_model_metrics.json")

@app.get("/model-metrics")
def model_metrics():
    """
    Returns verified model evaluation results read from CAHRA_model_metrics.json.

    Source: Google Colab training run on the real hospital dataset.
    Split:  Chronological held-out test set (no data leakage).
    Model:  CAHRA_gradient_boosting_model.pkl — HistGradientBoostingRegressor.

    The persistence baseline figures (MAE 3.77, RMSE 7.77, R² -0.2508)
    were produced during the same evaluation run and are included here
    as the comparison baseline since they are not stored in the JSON.
    """
    import json

    try:
        with open(METRICS_PATH, "r") as f:
            m = json.load(f)
    except FileNotFoundError:
        return {"error": "CAHRA_model_metrics.json not found in backend directory"}

    return [
        # --- Persistence Baseline (held-out test set, user-verified) ---
        {
            "model": "Persistence Baseline",
            "split": "Held-Out Test Set",
            "mae":  3.77,
            "rmse": 7.77,
            "mse":  round(7.77 ** 2, 2),
            "mape": None,
            "r2":  -0.2508,
        },
        # --- CAHRA Gradient Boosting — Validation Set (from JSON) ---
        {
            "model": "CAHRA Gradient Boosting",
            "split": "Validation Set",
            "mae":  m["validation_MAE"],
            "rmse": m["validation_RMSE"],
            "mse":  round(m["validation_RMSE"] ** 2, 2),
            "mape": None,
            "r2":   m["validation_R2"],
        },
        # --- CAHRA Gradient Boosting — Held-Out Test Set (from JSON) ---
        {
            "model": "CAHRA Gradient Boosting",
            "split": "Held-Out Test Set",
            "mae":  m["test_MAE"],
            "rmse": m["test_RMSE"],
            "mse":  round(m["test_RMSE"] ** 2, 2),
            "mape": None,
            "r2":   m["test_R2"],
        },
    ]