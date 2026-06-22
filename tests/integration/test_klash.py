from gltest import get_contract_factory
from gltest.assertions import tx_execution_succeeded


def test_propose_and_clash_consensus():
    factory = get_contract_factory("Klash")
    contract = factory.deploy(args=[])

    # Deterministic proposing write.
    rc = contract.propose_thesis(
        args=["Artificial General Intelligence timeline", "AGI will be achieved before 2030 through massive compute scale."]
    ).transact()
    assert tx_execution_succeeded(rc)

    arenas = contract.get_arenas(args=[0]).call()
    assert len(arenas) == 1
    arena_id = arenas[0]["id"]

    # AI consensus write: debate clash.
    # An argument that does not decisively overthrow should be a stable DEFEND.
    rc2 = contract.clash_thesis(
        args=[arena_id, "AGI is decades away because deep learning alone has hit a wall."]
    ).transact()
    assert tx_execution_succeeded(rc2)

    arena = contract.get_arena(args=[arena_id]).call()
    assert int(arena["clashes"]) == 1
    assert arena["last_winner"] in ("PROPONENT", "OPPONENT")
    assert 0 <= int(arena["last_margin"]) <= 100

    stats = contract.get_stats(args=[]).call()
    assert int(stats["debates"]) == 1
