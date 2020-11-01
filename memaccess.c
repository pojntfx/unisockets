#include "memaccess.h"
#include <stdint.h>
#include <stdio.h>

int main() {
  uint8_t mynum = 55;

  transfer_num_pointer_to_runtime((void *)&mynum);

  printf("Got num: %d\n", get_num_from_runtime());

  return 0;
}