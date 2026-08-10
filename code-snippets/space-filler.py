import turtle
t = turtle.Turtle()

def fill(n, s=1):
    if not n:
        return
    t.left(90 * s)
    fill(n - 1, -s)
    t.forward(10)
    t.right(90 * s)
    fill(n - 1, s)
    t.forward(10)
    fill(n - 1, s)
    t.right(90 * s)
    t.forward(10)
    fill(n - 1, -s)
    t.left(90 * s)

t.speed(10)
t.pensize(7)
t.pencolor("green")

t.penup()
t.goto(-75, -75)
t.pendown()
fill(4)
t.penup()

turtle.done()
