# -*- coding: utf-8 -*-
"""★評価スコアリングモデル v1.1
Gemini監査提案(ベイズ平滑化・成分分離・Tier制限)をベースに、
★5到達可能なようスケールを再校正(原案の重みでは理論最大73点で★5不可のため)。
構成: base(店格0-25) + rule(ベイズ勝率×45) + x(告知0-25) + third(第三者0-15) = 最大100超はクリップ
"""
def calculate_bayes_win_rate(k, n, alpha=1.0, beta=3.0):
    return (k + alpha) / (n + alpha + beta)

def tier_of(n, p_raw):
    if n >= 10 and p_raw >= 0.8: return 1
    if n >= 5 and p_raw >= 0.8: return 2
    if n < 5: return 3
    return 2

def evaluate_store_day(store_rank, rule_k, rule_n, x_announcement_level, third_party_score):
    base_scores = {'S': 25, 'A': 18, 'B': 10}
    b_score = base_scores.get(store_rank, 6)
    if rule_n > 0:
        p_bayes = calculate_bayes_win_rate(rule_k, rule_n)
        p_raw = rule_k / rule_n
    else:
        p_bayes, p_raw = 0.25, 0.0
    tier = tier_of(rule_n, p_raw)
    rule_score = p_bayes * 45
    if tier == 3:  # 仮説段階(N<5): デフォルト相当+最大10点まで
        rule_score = min(rule_score, 0.25 * 45 + 10)
    x_score = {0: 0, 1: 10, 2: 17, 3: 25}.get(x_announcement_level, 0)
    tp_score = {0: 0, 1: 8, 2: 15}.get(third_party_score, 0)
    final = min(100.0, b_score + rule_score + x_score + tp_score)
    star = 5 if final >= 80 else 4 if final >= 65 else 3 if final >= 50 else 2 if final >= 35 else 1
    return {"final_score": round(final, 1), "star": star, "bayes_win_rate": round(p_bayes, 3),
            "tier": tier, "breakdown": {"base": b_score, "rule": round(rule_score, 1), "x": x_score, "third_party": tp_score}}

if __name__ == "__main__":
    cases = [
        ("鬼に金棒(S店,6/6,告知確定級,第三者一部)", ('S', 6, 6, 3, 1)),
        ("通常日A店(法則なし告知なし)", ('A', 0, 0, 0, 0)),
        ("B店Tier3法則(2/2)+抽象告知", ('B', 2, 2, 1, 0)),
        ("A店 Tier1想定(12/15)+具体告知+第三者強一致", ('A', 12, 15, 2, 2)),
    ]
    for name, args in cases:
        print(name, "->", evaluate_store_day(*args))
