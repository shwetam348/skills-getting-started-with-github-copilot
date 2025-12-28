import copy
import pytest

from fastapi.testclient import TestClient

from src import app as app_module


client = TestClient(app_module.app)


@pytest.fixture(autouse=True)
def restore_activities():
    # snapshot activities before each test and restore afterwards
    orig = copy.deepcopy(app_module.activities)
    yield
    app_module.activities = orig


def test_get_activities():
    res = client.get("/activities")
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, dict)
    # some known keys from the seed data
    assert "Chess Club" in data


def test_signup_and_remove_participant():
    activity = "Art Club"
    email = "teststudent@mergington.edu"

    # ensure participant not present
    res = client.get("/activities")
    assert res.status_code == 200
    assert email not in res.json()[activity]["participants"]

    # sign up
    res = client.post(f"/activities/{activity}/signup", params={"email": email})
    assert res.status_code == 200
    assert "Signed up" in res.json().get("message", "")

    # verify present
    res = client.get("/activities")
    assert res.status_code == 200
    assert email in res.json()[activity]["participants"]

    # remove participant
    res = client.delete(f"/activities/{activity}/participants", params={"email": email})
    assert res.status_code == 200
    assert "Removed" in res.json().get("message", "")

    # verify removed
    res = client.get("/activities")
    assert res.status_code == 200
    assert email not in res.json()[activity]["participants"]
