# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }
from genlayer import *
import json

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
