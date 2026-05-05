# apps/academic_workload/services.py
import os
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()


def build_prompt(comments: list[str], criteria: list[dict]) -> str:
    x = len(comments)
    y = len(criteria)

    rol = (
        "Rol: Actúa como una herramienta para leer comentarios positivos o negativos "
        "para un maestro universitario y medir la capacidad del maestro dado ciertos criterios."
    )

    contex = (
        f"Contexto: Se te dará una cadena de texto con {x} cantidad de comentarios "
        f"y {y} criterios (los criterios pueden traer o no una explicación de los mismos). "
        "Estos son los comentarios de la evaluación de los alumnos a un docente."
    )

    objetive = (
        "Objetivo: Deberás analizar y entregar dos arreglos: "
        "el primero: si la respuesta es positiva (P) o si es negativa (N) por cada comentario; "
        "el segundo: una puntuación de 0 a 100 según los criterios para el docente."
    )

    fmt = (
        'Formato de respuesta: La respuesta del primer arreglo debes darla únicamente en un '
        'arreglo de Ps y Ns según lo solicitado ["P","N","P","N"] en formato JSON. '
        'La respuesta del segundo arreglo de enteros de 0 a 100 según lo solicitado [55,42,93,87] '
        'ambos en una sola línea de texto sin espacios.'
    )

    example = (
        '\nEjemplos:\n'
        'Input: Comentarios: Excelente maestro; No explica bien; Muy claro; Da mucha tarea; llega tarde a veces; '
        'Criterios: Puntualidad; Claridad; Aprendizaje de alumnos;\n'
        'Output: ["P","N","P","N","N"][75,85,90]\n'
    )

    comments_block = "Comentarios:\n" + "".join(f"{c};\n" for c in comments)

    criteria_lines = []
    for cr in criteria:
        line = cr['name']
        if cr.get('description'):
            line += f": {cr['description']}"
        criteria_lines.append(line + ";")
    criteria_block = "Criterios:\n" + "\n".join(criteria_lines)

    return rol + contex + objetive + fmt + example + comments_block + criteria_block


def call_ai(prompt: str) -> str:
    client = OpenAI(
        api_key=os.getenv("DASHSCOPE_API_KEY"),
        base_url="https://dashscope-intl.aliyuncs.com/compatible-mode/v1",
    )
    completion = client.chat.completions.create(
        model="qwen-plus",
        messages=[{"role": "user", "content": prompt}],
        temperature=0,
        max_tokens=500,
    )
    return completion.choices[0].message.content


def parse_ai_response(raw: str) -> tuple[list[str], list[float]]:
    raw = raw.strip()
    close_bracket = raw.index('][')
    sentiments_part = raw[1:close_bracket]           
    scores_part = raw[close_bracket + 2:-1]

    sentiments = [s.strip().strip('"') for s in sentiments_part.split(',')]
    scores = [float(s.strip()) for s in scores_part.split(',')]

    return sentiments, scores


def analyze_teacher(
    comments: list[dict],       
    criteria: list[dict],     
) -> dict:
    
    comment_texts = [c['content'] for c in comments]
    prompt = build_prompt(comment_texts, criteria)
    raw = call_ai(prompt)
    sentiments, scores = parse_ai_response(raw)

    
    comments_result = [
        {
            'comment_id': comments[i]['comment_id'],
            'content': comments[i]['content'],
            'sentiment': sentiments[i] if i < len(sentiments) else 'N',
        }
        for i in range(len(comments))
    ]

    
    criteria_scores = []
    for i, criterion in enumerate(criteria):
        raw_score = scores[i] if i < len(scores) else 0.0
        weight = float(criterion['percentage'])          
        weighted = round(raw_score * (weight * 0.01), 2)
        criteria_scores.append({
            'criterion_id': criterion['criterion_id'],
            'name': criterion['name'],
            'raw_score': raw_score,
            'weight_percentage': weight,
            'weighted_score': weighted,
        })

    final_score = round(sum(c['weighted_score'] for c in criteria_scores)/20, 2)
    positive_count = sentiments.count('P')
    negative_count = sentiments.count('N')

    return {
        'total_comments': len(comments),
        'positive_count': positive_count,
        'negative_count': negative_count,
        'comments': comments_result,
        'criteria_scores': criteria_scores,
        'final_score': final_score,
    }