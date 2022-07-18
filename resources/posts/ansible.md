---
template: detail
title: Managing infrastructure with Ansible
date: 2022-04-08
author: Jon Koenig
---
Ansible is a software deployment tool that you can use to set up your home server. You will organize commands into [playbooks](https://docs.ansible.com/ansible/latest/user_guide/playbooks_intro.html) and run them against [managed nodes](https://docs.ansible.com/ansible/latest/network/getting_started/basic_concepts.html#managed-nodes) from a [control node](https://docs.ansible.com/ansible/latest/network/getting_started/basic_concepts.html#control-node). The control node can be a device running macOS or a linux distribution. Windows is not directly supported, so WSL2 or a virtual machine is required.

Creating an Ansible playbook is not the shortest process. We will be starting with an empty folder and ending with a functional playbook, however my use case for Ansible consists of managing a very small number of devices, so this will not be the most in-depth guide. The goal is to be concise for the average person, and the information in this document will be expanded upon over time as my needs change.

## Inventory

The first file that we will create is an **inventory** file. It will define the hosts, or **managed nodes** that we will be targeting. You will put information about your home server in here.

The inventory file can be extremely simple. Here we are defining a single host, and specifying that it can be found at 10.0.0.60 on our local network.

```sh
all:
  hosts:
      10.0.0.60
```

You can give your host an alias, but you will need to include some variables below it to provide the important information.

```sh
all:
  hosts:
      my-server:
        ansible_host: 10.0.0.60
        ansible_port: 22
        ansible_user: guy
        ansible_connection: ssh
        ansible_ssh_private_key_file: /Users/guy/.ssh/my-server
```

You can organize hosts into groups and execute a playbook on all of the hosts in that group at once, so it is worth giving this some thought. I will just be adding a single host to a group called **servers**.

```sh
all:
  children:
    servers:
      hosts:
        my-server:
          ansible_port: 22
          ansible_host: 10.0.0.60
          ansible_user: guy
          ansible_connection: ssh
          ansible_ssh_private_key_file: /Users/guy/.ssh/my-server
```

Looking above, we see that every host that we create is a member of the **all** group by default. The **children** keyword is used to create sub-groups. By organizing the file this way, we are telling Ansible that **servers** is a sub-group of **all**.

## Configuration

Ansible will need you to specify a path to an inventory file with the **-i** argument, or it will not understand where to find your hosts. 

I find it preferable to create an **ansible.cfg** file in the root of the project directory with a couple lines that will allow Ansible to find our inventory automatically.

```sh
[defaults]
INVENTORY = inventory.yml
```

With this configuration, Ansible will look for a file called **inventory.yml** in the current directory when it needs to find information on a host.

Ansible will search for a configuration file in these directories, and in this order:

- ANSIBLE_CONFIG (environment variable if set)
- ./ansible.cfg (current directory)
- ~/.ansible.cfg (home directory)
- /etc/ansible/ansible.cfg

## Tasks

Tasks are small sets of instructions that allow Ansible to understand how an action is performed. We will write a task to disable password-based SSH authentication on our host.

```
- name: Disable SSH password authentication
  lineinfile:
    dest: /etc/ssh/sshd_config
    regexp: "^#PasswordAuthentication yes"
    line: "PasswordAuthentication no"
  register: sshd_config
```

In the first line, we define an arbitrary name for the task.

Next, we call a [module](https://docs.ansible.com/ansible/latest/user_guide/modules_intro.html) by name. A module is a reusable script that tells Ansible how to perform an action. If we refer to the Ansible wiki and read the module's synopsis, it is described as being useful "primarily useful when you want to change a single line in a file only."

Modules will almost always have some parameters that you must provide. Checking the appropriate section in the [documentation](https://docs.ansible.com/ansible/latest/collections/ansible/builtin/lineinfile_module.html#parameters) is the easiest way to determine what you need, just look for the parameters that say **required** in red text.

This module happens to be built in to Ansible, but in the event that you need functionality from a module that is not built in, you can often find what you need on [Ansible Galaxy](https://galaxy.ansible.com).

A task to enable password-less sudo can look something like this:

```
- name: Enable passwordless sudo for "{{ username }}"
  lineinfile:
    dest: /etc/sudoers
    regexp: "^%wheel"
    line: "{{ username }} ALL=(ALL) NOPASSWD: ALL"
    validate: "/usr/sbin/visudo -cf %s"
```

The {{ username }} part is a variable, more on those soon.

## Playbooks

A playbook is a group of tasks in the same file. If the two tasks we have just written are both in a file called **ssh.yml**, that would make it a playbook. We can now create another file called **run.yml** that looks something like this:

```
- name: Configure SSH
  hosts: all
  become: yes
  tasks:
    - import_tasks: tasks/ssh.yml
```

Keep in mind, this is still a task. It just happens to load and execute other tasks from our **ssh.yml** file. Splitting tasks up and placing them in their own files with other related tasks is a common practice, and makes it easier to reason about your project.

If we had another playbook called **environment.yml** we can include those in our **run.yml** playbook as well, and it might look like this:

```
- name: Configure SSH
  hosts: all
  become: yes
  tasks:
    - import_tasks: tasks/ssh.yml

- name: Set environment
  hosts: all
  become: yes
  tasks:
    - import_tasks: tasks/environment.yml
```

The **hosts: all** line means that Ansible should run these tasks on all of the hosts found in your inventory file.

## Variables

Ansible allows you to create **host** and **group** variables, the former being available only to that host and the latter being available for any host within that group.

Consider a scenario where you have an inventory file with this host in it:

```sh
all:
  children:
    dallas:
      hosts:
        dallas01:
          ansible_port: 22
          ansible_host: 10.0.0.107
          ansible_user: guy
          ansible_connection: ssh
          ansible_ssh_private_key_file: /Users/guy/.ssh/dallas01
```

Ansible will look in the following files when it needs to find variables for the **dallas01** host.

- ./group_vars/dallas.yml
- ./host_vars/dallas01.yml

Host **dallas01** not only has its own host variables file, but it is a member of the dallas group and therefore has access to the dallas group variables as well.

You can also include variables directly in a playbook, or inject them during the play.

```sh
- hosts: all
  vars:
    favcolor: blue
  vars_files:
    - /vars/private.yml.yml

  tasks:
    - import_tasks: tasks/environment.yml
```

## Storing Private Data

There are a few strategies for safeguarding your private data. In my case, I have created a new directory called **vars,** which contains a **private.yml** file which contains my private variables.

```sh
private_access_token: "ghp_realtoken"
```

I have private information in this **private.yml** file and also in my inventory file, **hosts.yml,** from earlier. I'll add both of these files to the .gitignore at the root of my project, so it now looks like this:

```sh
hosts.yml
vars/private.yml
```

Next, I create example files in place of the real ones. I start by creating a **private_example.yml** right next to the **private.yml**. These example files will be added to the repository.

```sh
personal_access_token: "PAT"
```

I do the same with my inventory file by creating a **hosts_example.yml** at the root of my project, right next to the original.

```sh
all:
  children:
    servers:
      hosts:
        host-alias:
          ansible_port: example_port
          ansible_host: example_ip
          ansible_user: example_user
          ansible_connection: example_connection_type
          ansible_ssh_private_key_file: example_absolute_path_to_ssh_private_key
```

Now when I clone my project later down the road, it will be trivial to recall what files I need to create and populate with real information to get my playbooks working again. 

Simply create a file with a name identical to the example file, but without the _example part, and then copy the data from the example to the real file and populate the variables with real data.

I also feel it is worth mentioning [Ansible Vault](https://docs.ansible.com/ansible/latest/user_guide/vault.html). This is a built-in tool that allows you to encrypt files that contain sensitive data. I personally do not use this tool, so refer to the documentation if you are interested in this solution.