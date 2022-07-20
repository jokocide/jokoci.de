---
template: detail
title: A brief guide to encrypting and decrypting with GPG
date: 2020-12-04
author: Jon Koenig
---
GPG is a tool that you can use to encrypt and decrypt messages, among other things. Many guides exist to provide a highly detailed
introduction to this tool and encryption as a whole, so here is one that serves more as a reference guide for those of us that have
some experience with the software already

## Creating keys

To begin, you need to create your keys.

```sh
gpg --full-gen-key
```

Follow the prompts and your keys will be created and added to your keyring -- unless you have a reason not to, go with the defaults.

## Encrypting

In our current directory, we have a text file called **message** that happens to contain a secret.

```sh
ls -l
total 16
-rw-r--r--  1 jkoenig  staff    22 Dec  4 09:33 message

cat message
37.2431° N, 115.7930° W
```

We can use the **-r** and **-e** options to encrypt the file.

```sh
gpg -r jokocide@outlook.com -e message
ls -l
total 24
-rw-r--r--  1 jkoenig  staff    22 Dec  4 09:33 message
-rw-r--r--  1 jkoenig  staff   488 Dec  4 09:37 message.gpg
```

You can see a new file **message.gpg** now exists, which represents our encrypted message.

Remember that deleting the file will most likely leave some form of [data remanence](https://en.wikipedia.org/wiki/Data_remanence),
so you will want to take steps to counter that.

## Decrypting

To decrypt our file and make it human readable again, the **-d** option is used.

```sh
gpg -d message.gpg

gpg: encrypted with 3072-bit RSA key, ID xxxxxxxxxxxx, created 2020-12-02
"Jon Koenig <jokocide@outlook.com>"

37.2431° N, 115.7930° W
```

Enter the key's password and the contents of the file will be printed out on your console. Your password will be cached to make decrypting multiple files at 
once a less painful process, and that can be security concern. Thanksfully this can be [changed](https://forums.linuxmint.com/viewtopic.php?t=254042)!