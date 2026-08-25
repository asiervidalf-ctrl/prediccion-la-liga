import server
from server import app


def test_home_page_is_available():
    client = app.test_client()
    response = client.get("/")

    assert response.status_code == 200
    assert b"PORRA CARALLEIRO" in response.data


def test_static_assets_are_available():
    client = app.test_client()

    assert client.get("/styles.css").status_code == 200
    assert client.get("/app.js").status_code == 200
    assert client.get("/data/players.json").status_code == 200


def test_prediction_can_be_published_and_listed(tmp_path, monkeypatch):
    monkeypatch.setattr(server, "DATABASE", tmp_path / "predictions.db")
    monkeypatch.setattr(server, "predictions_are_open", lambda: True)
    client = app.test_client()
    payload = {
        "author": "Caralleiro",
        "teams": [{"name": f"Equipo {index}"} for index in range(20)],
        "awards": {"pichichi": "Jugador"},
    }

    created = client.post("/api/predictions", json=payload)
    predictions = client.get("/api/predictions").get_json()

    assert created.status_code == 201
    assert len(predictions) == 1
    assert predictions[0]["author"] == "Caralleiro"


def test_closed_pool_rejects_new_predictions(monkeypatch):
    monkeypatch.setattr(server, "predictions_are_open", lambda: False)
    response = app.test_client().post("/api/predictions", json={})

    assert response.status_code == 403
