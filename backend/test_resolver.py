from core.resolver import resolve_config

def test_resolver():
    upstream = {
        "node_1": {
            "status_code": 200,
            "body": {
                "message": "hello",
                "dog": {
                    "url": "https://dog.ceo/img.jpg"
                }
            }
        },
        "node_2": {
            "is_active": True,
            "count": 5
        }
    }

    # Test 1: Simple string replacement
    config1 = {"msg": "The status is {status_code} and message is {message}"}
    resolved1 = resolve_config(config1, upstream)
    assert resolved1["msg"] == "The status is 200 and message is hello"

    # Test 2: Nested property reference (dot notation)
    config2 = {"img_url": "{body.dog.url}"}
    resolved2 = resolve_config(config2, upstream)
    assert resolved2["img_url"] == "https://dog.ceo/img.jpg"

    # Test 3: Prefix reference (node_id specificity)
    config3 = {"img_url": "{node_1.body.dog.url}"}
    resolved3 = resolve_config(config3, upstream)
    assert resolved3["img_url"] == "https://dog.ceo/img.jpg"

    # Test 4: Preserving type (boolean, number, dict)
    config4 = {
        "active": "{is_active}",
        "nodes_count": "{count}",
        "raw_body": "{body}"
    }
    resolved4 = resolve_config(config4, upstream)
    assert resolved4["active"] is True
    assert resolved4["nodes_count"] == 5
    assert resolved4["raw_body"] == {"message": "hello", "dog": {"url": "https://dog.ceo/img.jpg"}}

    # Test 5: Nested config structure
    config5 = {
        "payload": {
            "items": ["{count}", "hello {message}"],
            "nested_dict": {
                "flag": "{is_active}"
            }
        }
    }
    resolved5 = resolve_config(config5, upstream)
    assert resolved5["payload"]["items"] == [5, "hello hello"]
    assert resolved5["payload"]["nested_dict"]["flag"] is True

    # Test 6: List resolving
    upstream_list = {
        "node_http": {
            "response": [
                {
                    "setup": "What's the best thing about a Boolean?",
                    "punchline": "Even if you are wrong, you are only off by a bit."
                }
            ]
        }
    }
    config6 = {
        "setup_with_idx": "{node_http.response.0.setup}",
        "punchline_with_idx": "{response.0.punchline}",
        "setup_no_idx": "{node_http.response.setup}",
        "punchline_no_idx": "{response.punchline}"
    }
    resolved6 = resolve_config(config6, upstream_list)
    assert resolved6["setup_with_idx"] == "What's the best thing about a Boolean?"
    assert resolved6["punchline_with_idx"] == "Even if you are wrong, you are only off by a bit."
    assert resolved6["setup_no_idx"] == "What's the best thing about a Boolean?"
    assert resolved6["punchline_no_idx"] == "Even if you are wrong, you are only off by a bit."

    print("All resolver tests passed successfully!")

if __name__ == "__main__":
    test_resolver()
