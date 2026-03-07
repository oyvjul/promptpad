Output demo2.gif

Set Shell bash
Set Width 900
Set Height 500
Set FontSize 16
Set Padding 20

# Start tmux and claude before recording is visible
Hide
Type "tmux"
Enter
Sleep 2s
Type "claude"
Enter
Sleep 5s
Show

# Now inside Claude Code - type the !ppd command
Set TypingSpeed 100ms
Type "!ppd"
Sleep 600ms
Enter
Sleep 2s

Set TypingSpeed 80ms
Type "Hello world! "
Enter
Sleep 300ms
Set TypingSpeed 50ms
Type "This is promptpad "
Sleep 300ms
Set TypingSpeed 120ms
Type "- a minimal terminal text editor."
Sleep 1s

Enter
Enter
Set TypingSpeed 60ms
Type "It tracks lines, characters, and tokens."
Sleep 1s
