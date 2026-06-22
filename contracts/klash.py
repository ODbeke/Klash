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
