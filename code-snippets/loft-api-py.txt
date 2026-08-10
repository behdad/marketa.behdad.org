import loft

status = loft.game.status()
print(status)

# Actions start when called; await one when you need its final result.
loft.weather.rain.set(None)  # release the override back to automatic weather
# loft.party.set(True)
# await loft.room.go("garden")
