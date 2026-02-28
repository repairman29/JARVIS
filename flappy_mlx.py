import pygame
import random
import requests
import time
import threading
import subprocess

ELEVENLABS_KEY = "sk_dcd6c7f2dde7cab80421df8afab14901b3b8b16cb4b61abd"
TTS_URL = "https://api.elevenlabs.io/v1/text-to-speech/EXAVITQu4vr4xnSDxMaL"

SITUATIONAL_INSULTS = {
    "flap_streak": ["Not bad!", "Okay fine!", "Don't get cocky!", "Beginner's luck!"],
    "multi_flap": ["Calm down!", "Relax!", "Okay hotshot!", "Stop it!"],
    "close_call": ["That was close!", "Whew!", "Almost died!", "My circuits!"],
    "pipe_hit": ["CRASH!", "Ouch!", "Pipe: 1, You: 0!", "Idiot!"],
    "ground_hit": ["Splatt!", "Gravity wins!", "Floor concrete!", "Brick!"],
    "ceiling_hit": ["Head injury!", "Oops!", "Ceiling: 1!", "Mark!"],
    "high_score": ["New high score!", "Impressive!", "Not useless!", "Circuits rewired!"],
    "score_5": ["Five points!", "On a roll!", "Getting cocky!"],
    "score_10": ["Ten! Cheating?", "I'm impressed!", "Show off!"],
    "score_20": ["Twenty! Insane!", "Dominating!", "Stop it!"],
}

last_comment_time = 0
flap_count = 0
last_flap_time = 0

WHITE = (255, 255, 255)
SKY_BLUE = (135, 206, 235)
PIPE_GREEN = (34, 139, 34)
BIRD_YELLOW = (255, 215, 0)
ORANGE = (255, 165, 0)

pygame.init()
WIDTH, HEIGHT = 400, 600
screen = pygame.display.set_mode((WIDTH, HEIGHT))
pygame.display.set_caption("Flappy Bird - Pure AI")
clock = pygame.time.Clock()

font = pygame.font.SysFont("arial", 48, bold=True)
small_font = pygame.font.SysFont("arial", 18)

bird_x = 60
bird_y = HEIGHT // 2
bird_velocity = 0
gravity = 0.35
jump_strength = -14

wing_frame = 0
wing_timer = 0

pipes = []
pipe_width = 40
pipe_gap = 200
pipe_speed = 2.5
pipe_spawn_timer = 0

score = 0
high_score = 0
game_over = False

ai_log = []

tts_lock = threading.Lock()

def speak(text):
    def _speak():
        try:
            with tts_lock:
                resp = requests.post(
                    TTS_URL,
                    headers={
                        "Accept": "audio/mpeg",
                        "Content-Type": "application/json",
                        "xi-api-key": ELEVENLABS_KEY
                    },
                    json={
                        "text": text,
                        "voice_settings": {"stability": 0, "similarity_boost": 1}
                    },
                    timeout=10
                )
                if resp.status_code == 200:
                    with open("/tmp/insult.mp3", "wb") as f:
                        f.write(resp.content)
                    subprocess.run(["afplay", "/tmp/insult.mp3"], capture_output=True, timeout=5)
        except:
            pass
    
    threading.Thread(target=_speak, daemon=True).start()

def get_situation_insult(situation):
    pool = SITUATIONAL_INSULTS.get(situation, SITUATIONAL_INSULTS["close_call"])
    return random.choice(pool)

def draw_bird(x, y, velocity):
    global wing_frame, wing_timer
    
    wing_timer += 1
    if wing_timer > 4:
        wing_timer = 0
        wing_frame = (wing_frame + 1) % 3
    
    body_color = BIRD_YELLOW
    beak_color = ORANGE
    
    pygame.draw.ellipse(screen, body_color, (x, y, 28, 22))
    pygame.draw.circle(screen, (0, 0, 0), (x + 22, y + 8), 3)
    pygame.draw.circle(screen, (255, 255, 255), (x + 23, y + 7), 1)
    pygame.draw.polygon(screen, beak_color, [(x + 26, y + 10), (x + 34, y + 13), (x + 26, y + 16)])
    
    if velocity < 0:
        wing_y = y - 12
    elif wing_frame == 0:
        wing_y = y + 2
    elif wing_frame == 1:
        wing_y = y - 4
    else:
        wing_y = y + 6
    
    pygame.draw.ellipse(screen, body_color, (x + 2, wing_y, 18, 12))
    pygame.draw.line(screen, (200, 150, 0), (x + 6, wing_y + 6), (x + 16, wing_y + 6), 2)

def ai_decide():
    """Pure rule-based AI - guaranteed to work"""
    global ai_log
    
    bird_center = bird_y + 10
    safe_zone_top = pipe_gap // 2 - 10
    safe_zone_bottom = pipe_gap // 2 + 10
    
    for pipe in pipes:
        dist = pipe[0] - bird_x
        
        if -20 < dist < 100:
            gap_top = pipe[1]
            gap_bottom = pipe[1] + pipe_gap
            gap_center = gap_top + pipe_gap // 2
            
            target_y = gap_center - 10
            
            if bird_center > target_y + 15:
                ai_log.append(f"FLAP - below gap (y={bird_y})")
                return True
            elif bird_center < target_y - 15 and dist < 60:
                ai_log.append(f"WAIT - above gap, close")
                return False
            elif dist < 30:
                ai_log.append(f"FLAP - emergency!")
                return True
    
    if bird_y > HEIGHT - 200:
        ai_log.append(f"FLAP - low!")
        return True
    
    if bird_y < 150:
        ai_log.append(f"WAIT - high")
        return False
    
    if bird_velocity > 4:
        ai_log.append(f"FLAP - falling fast")
        return True
    
    ai_log.append(f"WAIT - safe")
    return False

def reset_game():
    global bird_y, bird_velocity, pipes, score, game_over, ai_log
    bird_y = HEIGHT // 2
    bird_velocity = 0
    pipes = []
    score = 0
    game_over = False
    ai_log = []

reset_game()

running = True

while running:
    screen.fill(SKY_BLUE)
    
    for event in pygame.event.get():
        if event.type == pygame.QUIT or (event.type == pygame.KEYDOWN and event.key == pygame.K_ESCAPE):
            running = False
        if event.type == pygame.KEYDOWN and event.key == pygame.K_SPACE:
            bird_velocity = jump_strength

    if not game_over:
        current_time = time.time()
        
        should_flap = ai_decide()
        
        if should_flap:
            bird_velocity = jump_strength
            
            flap_count += 1
            if current_time - last_flap_time < 0.3:
                flap_count += 1
            
            if current_time - last_comment_time > 0.8:
                last_comment_time = current_time
                if flap_count >= 3:
                    speak(get_situation_insult("multi_flap"))
                elif score >= 20:
                    speak(get_situation_insult("score_20"))
                elif score >= 10:
                    speak(get_situation_insult("score_10"))
                elif score >= 5:
                    speak(get_situation_insult("score_5"))
                else:
                    speak(get_situation_insult("flap_streak"))
            
            flap_count = 0
            last_flap_time = current_time
        
        bird_velocity += gravity
        bird_y += bird_velocity
        
        pipe_spawn_timer += 1
        if pipe_spawn_timer >= 100:
            pipes.append([WIDTH, random.randint(120, HEIGHT - pipe_gap - 120)])
            pipe_spawn_timer = 0
        
        for pipe in pipes:
            pipe[0] -= pipe_speed
            
            bird_left = bird_x + 3
            bird_right = bird_x + 22
            bird_top = bird_y + 3
            bird_bottom = bird_y + 19
            
            pipe_hitbox_left = pipe[0] + 3
            pipe_hitbox_right = pipe[0] + pipe_width - 3
            
            if bird_right > pipe_hitbox_left and bird_left < pipe_hitbox_right:
                if bird_top < pipe[1] or bird_bottom > pipe[1] + pipe_gap:
                    game_over = True
                    speak(get_situation_insult("pipe_hit"))
            
            if pipe[0] + pipe_width < bird_x <= pipe[0] + pipe_width + pipe_speed:
                score += 1
                if score == 5:
                    speak(get_situation_insult("score_5"))
                elif score == 10:
                    speak(get_situation_insult("score_10"))
                elif score == 20:
                    speak(get_situation_insult("score_20"))
        
        pipes = [p for p in pipes if p[0] + pipe_width > 0]
        
        if bird_y > HEIGHT - 20:
            game_over = True
            speak(get_situation_insult("ground_hit"))
        
        if bird_y < 0:
            game_over = True
            speak(get_situation_insult("ceiling_hit"))
        
        if game_over:
            if score > high_score:
                high_score = score
                speak(get_situation_insult("high_score"))
            time.sleep(0.3)
            reset_game()
        
        if len(ai_log) > 4:
            ai_log.pop(0)

    for pipe in pipes:
        pygame.draw.rect(screen, PIPE_GREEN, (pipe[0], 0, pipe_width, pipe[1]))
        pygame.draw.rect(screen, PIPE_GREEN, (pipe[0], pipe[1] + pipe_gap, pipe_width, HEIGHT - pipe[1] - pipe_gap))
        pygame.draw.rect(screen, (20, 100, 20), (pipe[0] + 3, 0, 4, pipe[1]))
        pygame.draw.rect(screen, (20, 100, 20), (pipe[0] + 3, pipe[1] + pipe_gap, 4, HEIGHT - pipe[1] - pipe_gap))

    draw_bird(bird_x, bird_y, bird_velocity)
    
    score_text = font.render(str(score), True, WHITE)
    screen.blit(score_text, (WIDTH//2 - 15, 40))
    
    if high_score > 0:
        high_text = small_font.render(f"Best: {high_score}", True, WHITE)
        screen.blit(high_text, (WIDTH - 80, 10))
    
    log_y = 35
    for log_entry in ai_log:
        log_text = small_font.render(log_entry, True, (200, 255, 200))
        screen.blit(log_text, (10, log_y))
        log_y += 20

    pygame.display.flip()
    clock.tick(60)

pygame.quit()
