# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }
from genlayer import *
import json

ERR_EXPECTED = "[EXPECTED]"
ERR_LLM = "[LLM_ERROR]"

PAGE = 20
MIN_MARGIN = 12          # an opponent must win by at least this margin to overthrow
MAX_TOPIC = 90
MAX_CLAIM = 500
MAX_PROGRESSION = 24     # past theses retained per arena
MAX_LEDGER = 200


def _clean(s, lo: int, hi: int, label: str) -> str:
    s = str(s if s is not None else "").strip()
    if not (lo <= len(s) <= hi):
        raise gl.vm.UserError(f"{ERR_EXPECTED} {label} must be {lo}-{hi} characters")
    return s


def _normalize_clash(raw) -> dict:
    if isinstance(raw, str):
        first, last = raw.find("{"), raw.rfind("}")
        if first < 0 or last < 0:
            raise gl.vm.UserError(f"{ERR_LLM} No JSON object in response")
        raw = json.loads(raw[first:last + 1])
    if not isinstance(raw, dict):
        raise gl.vm.UserError(f"{ERR_LLM} Non-dict verdict: {type(raw)}")
    verdict = str(raw.get("verdict", "")).strip().upper()
    if verdict not in ("DEFEND", "OVERTHROW"):
        raise gl.vm.UserError(f"{ERR_LLM} Bad verdict: {verdict!r}")
    try:
        margin = max(0, min(100, int(round(float(str(raw.get("margin", 0)).strip())))))
    except (ValueError, TypeError):
        raise gl.vm.UserError(f"{ERR_LLM} Non-numeric margin")
    note = str(raw.get("note", "")).strip()[:240]
    return {"verdict": verdict, "margin": margin, "note": note}


def _handle_leader_error(leaders_res, leader_fn) -> bool:
    leader_msg = getattr(leaders_res, "message", "")
    try:
        leader_fn()
        return False
    except gl.vm.UserError as e:
        msg = getattr(e, "message", str(e))
        if msg.startswith(ERR_EXPECTED):
            return msg == leader_msg
        return False
    except Exception:
        return False


class Klash(gl.Contract):
    owner: Address
    arenas: TreeMap[str, str]        # id -> JSON arena record (dominant thesis + history)
    arena_ids: DynArray[str]
    ledger: DynArray[str]            # append-only debate events
    seq: u256
    total_debates: u256
    total_overthrows: u256

    def __init__(self):
        self.owner = gl.message.sender_address
        self.seq = u256(0)
        self.total_debates = u256(0)
        self.total_overthrows = u256(0)

    # ---------------------------------------------------------------- writes

    @gl.public.write
    def propose_thesis(self, topic: str, opening_claim: str) -> str:
        topic = _clean(topic, 4, MAX_TOPIC, "Topic")
        opening_claim = _clean(opening_claim, 10, MAX_CLAIM, "Opening claim")

        self.seq += u256(1)
        arena_id = f"A{int(self.seq)}"
        proponent = gl.message.sender_address.as_hex
        record = {
            "id": arena_id,
            "topic": topic,
            "proponent": proponent,
            "claim": opening_claim,
            "founder": proponent,
            "progression_index": 1,
            "defenses": 0,
            "clashes": 0,
            "last_winner": "",
            "last_margin": 0,
            "last_note": "",
            "progression": [],
        }
        self.arenas[arena_id] = json.dumps(record)
        self.arena_ids.append(arena_id)
        return arena_id

    @gl.public.write
    def clash_thesis(self, arena_id: str, contender_claim: str) -> None:
        if arena_id not in self.arenas:
            raise gl.vm.UserError(f"{ERR_EXPECTED} Unknown arena")
        contender_claim = _clean(contender_claim, 10, MAX_CLAIM, "Contender claim")
        record = json.loads(self.arenas[arena_id])
        opponent = gl.message.sender_address.as_hex

        verdict = self._duel(record["topic"], record["claim"], contender_claim)

        # Deterministic backstop: overthrow only on a decisive opponent win.
        overthrown = verdict["verdict"] == "OVERTHROW" and verdict["margin"] >= MIN_MARGIN

        record["clashes"] = int(record["clashes"]) + 1
        record["last_winner"] = "OPPONENT" if overthrown else "PROPONENT"
        record["last_margin"] = verdict["margin"]
        record["last_note"] = verdict["note"]
        self.total_debates += u256(1)

        if overthrown:
            progression = list(record.get("progression", []))
            progression.insert(0, {
                "proponent": record["proponent"],
                "claim": record["claim"],
                "defenses": int(record["defenses"]),
                "progression_index": int(record["progression_index"]),
                "toppled_by": opponent,
                "margin": verdict["margin"],
            })
            record["progression"] = progression[:MAX_PROGRESSION]
            record["proponent"] = opponent
            record["claim"] = contender_claim
            record["progression_index"] = int(record["progression_index"]) + 1
            record["defenses"] = 0
            self.total_overthrows += u256(1)
        else:
            record["defenses"] = int(record["defenses"]) + 1

        self.arenas[arena_id] = json.dumps(record)
        self._log({
            "arena": arena_id,
            "topic": record["topic"],
            "opponent": opponent,
            "result": "OVERTHROW" if overthrown else "DEFEND",
            "margin": verdict["margin"],
            "note": verdict["note"],
            "proponent": record["proponent"],
        })

    def _log(self, event: dict) -> None:
        self.ledger.append(json.dumps(event))
        if len(self.ledger) > MAX_LEDGER:
            tail = [self.ledger[i] for i in range(len(self.ledger) - MAX_LEDGER, len(self.ledger))]
            while len(self.ledger) > 0:
                self.ledger.pop()
            for e in tail:
                self.ledger.append(e)
