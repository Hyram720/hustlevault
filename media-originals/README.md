# Original media (backups, not served)

- `vault-intro-original.mp4`: the original gold Higgsfield vault intro (2560×1440, 24 fps, 5.17 s), also still at
  https://d8j0ntlcm91z4.cloudfront.net/user_391qpEAynVndVvvLA4RZWiHERjU/hf_20260811_165934_1c5a7a1f-5e2b-4b79-a7fd-42cca3f35a0a.mp4
- The site now plays `public/intro/vault-navy-lime.mp4`, a color-graded copy (same frames, resolution, fps and duration),
  made with ffmpeg:

```
ffmpeg -i vault-intro-original.mp4 -vf "hue=s=0,lutrgb=r='if(lt(val,100), 10+(37-10)*val/100, if(lt(val,232), 37+(198-37)*pow((val-100)/132,1.3), 198+(230-198)*(val-232)/23))':g='if(lt(val,100), 22+(64-22)*val/100, if(lt(val,232), 64+(255-64)*pow((val-100)/132,1.3), 255+(255-255)*(val-232)/23))':b='if(lt(val,100), 48+(122-48)*val/100, if(lt(val,232), 122+(0-122)*pow((val-100)/132,1.3), 0+(150-0)*(val-232)/23))',format=yuv420p" \
  -c:v libx264 -preset slow -crf 22 -profile:v high -movflags +faststart -c:a copy vault-navy-lime.mp4
```

To go back to gold: set `VAULT_VIDEO` in src/HustleVault.jsx to the cloudfront URL above.
